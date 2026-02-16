import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export class ApiKeyService {
  async create(input: {
    tenantId: string;
    name: string;
    scopes?: string[];
    rateLimit?: number;
    expiresAt?: Date;
  }) {
    // Generate a random API key
    const rawKey = `fsk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        keyHash,
        keyPrefix,
        scopes: input.scopes || ['read'],
        rateLimit: input.rateLimit || 1000,
        expiresAt: input.expiresAt,
      },
    });

    // Return the raw key only once
    return { ...apiKey, rawKey };
  }

  async list(tenantId: string) {
    return prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        requestCount: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, tenantId: string) {
    const key = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundError('API key not found');
    return prisma.apiKey.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });
  }

  async rotate(id: string, tenantId: string) {
    const key = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundError('API key not found');

    // Revoke old key
    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });

    // Create new key with same settings
    return this.create({
      tenantId,
      name: key.name,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt || undefined,
    });
  }

  async validate(rawKey: string) {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash, isActive: true },
    });

    if (!apiKey) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update usage stats
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date(), requestCount: { increment: 1 } },
    });

    return apiKey;
  }
}

export const apiKeyService = new ApiKeyService();
