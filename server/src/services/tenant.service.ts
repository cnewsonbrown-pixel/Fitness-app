import { prisma } from '../config/database.js';
import { Tenant, Tier, StaffRole } from '@prisma/client';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerId: string;
}

export interface UpdateTenantInput {
  name?: string;
  timezone?: string;
  currency?: string;
  bookingWindowDays?: number;
  cancellationWindowHours?: number;
  waitlistEnabled?: boolean;
  requireWaiver?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}

export class TenantService {
  /**
   * Create a new tenant (studio) and assign owner
   */
  async create(input: CreateTenantInput): Promise<Tenant> {
    const { name, slug, ownerId } = input;

    // Check if slug is available
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictError('This studio URL is already taken');
    }

    // Create tenant and assign owner in a transaction
    const tenant = await prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name,
          slug: slug.toLowerCase(),
        },
      });

      // Update user to belong to tenant
      await tx.user.update({
        where: { id: ownerId },
        data: { tenantId: newTenant.id },
      });

      // Create staff record for owner
      const user = await tx.user.findUnique({
        where: { id: ownerId },
      });

      await tx.staff.create({
        data: {
          tenantId: newTenant.id,
          userId: ownerId,
          role: StaffRole.OWNER,
          displayName: `${user?.firstName} ${user?.lastName}`.trim(),
          isInstructor: false,
        },
      });

      return newTenant;
    });

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  async getById(tenantId: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
    });
  }

  /**
   * Update tenant settings
   */
  async update(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Studio not found');
    }

    // Only allow customCss for premium tier
    if (input.customCss && tenant.tier !== Tier.PREMIUM) {
      delete input.customCss;
    }

    return prisma.tenant.update({
      where: { id: tenantId },
      data: input,
    });
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    return !tenant;
  }

  /**
   * Get tenant stats
   */
  async getStats(tenantId: string) {
    const [memberCount, activeMembers, staffCount, locationCount] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({
        where: {
          tenantId,
          lifecycleStage: 'ACTIVE',
        },
      }),
      prisma.staff.count({ where: { tenantId, isActive: true } }),
      prisma.location.count({ where: { tenantId, isActive: true } }),
    ]);

    return {
      totalMembers: memberCount,
      activeMembers,
      staffCount,
      locationCount,
    };
  }
}

export const tenantService = new TenantService();
