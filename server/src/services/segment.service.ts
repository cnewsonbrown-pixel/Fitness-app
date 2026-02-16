import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export interface CreateSegmentInput {
  tenantId: string;
  name: string;
  description?: string;
  criteria: SegmentCriteria;
  isDynamic?: boolean;
}

export interface SegmentCriteria {
  lifecycleStage?: string | string[];
  tags?: string[];
  hasActiveMembership?: boolean;
  membershipTypeId?: string;
  minLeadScore?: number;
  maxLeadScore?: number;
  joinedAfter?: string;
  joinedBefore?: string;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  minBookings?: number;
  maxBookings?: number;
}

export class SegmentService {
  async create(input: CreateSegmentInput) {
    const segment = await prisma.segment.create({ data: input });
    // Calculate initial member count
    const count = await this.calculateMemberCount(segment.id, input.tenantId);
    return prisma.segment.update({ where: { id: segment.id }, data: { memberCount: count } });
  }

  async getById(id: string, tenantId: string) {
    return prisma.segment.findFirst({ where: { id, tenantId } });
  }

  async list(tenantId: string) {
    return prisma.segment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, tenantId: string, data: Partial<CreateSegmentInput>) {
    const segment = await prisma.segment.findFirst({ where: { id, tenantId } });
    if (!segment) throw new NotFoundError('Segment not found');
    const updated = await prisma.segment.update({ where: { id }, data });
    if (data.criteria) {
      const count = await this.calculateMemberCount(id, tenantId);
      return prisma.segment.update({ where: { id }, data: { memberCount: count } });
    }
    return updated;
  }

  async delete(id: string, tenantId: string) {
    const segment = await prisma.segment.findFirst({ where: { id, tenantId } });
    if (!segment) throw new NotFoundError('Segment not found');
    await prisma.segment.delete({ where: { id } });
  }

  /**
   * Get members matching a segment's criteria
   */
  async getMembers(id: string, tenantId: string) {
    const segment = await prisma.segment.findFirst({ where: { id, tenantId } });
    if (!segment) throw new NotFoundError('Segment not found');

    const where = this.buildWhereClause(segment.criteria as any, tenantId);
    return prisma.member.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  /**
   * Recalculate member count for a segment
   */
  async calculateMemberCount(id: string, tenantId: string): Promise<number> {
    const segment = await prisma.segment.findFirst({ where: { id, tenantId } });
    if (!segment) return 0;

    const where = this.buildWhereClause(segment.criteria as any, tenantId);
    return prisma.member.count({ where });
  }

  /**
   * Refresh all dynamic segments for a tenant
   */
  async refreshAll(tenantId: string) {
    const segments = await prisma.segment.findMany({
      where: { tenantId, isDynamic: true },
    });

    for (const segment of segments) {
      const count = await this.calculateMemberCount(segment.id, tenantId);
      await prisma.segment.update({ where: { id: segment.id }, data: { memberCount: count } });
    }

    return { refreshed: segments.length };
  }

  /**
   * Build Prisma where clause from segment criteria
   */
  private buildWhereClause(criteria: SegmentCriteria, tenantId: string): Prisma.MemberWhereInput {
    const where: Prisma.MemberWhereInput = { tenantId };

    if (criteria.lifecycleStage) {
      if (Array.isArray(criteria.lifecycleStage)) {
        where.lifecycleStage = { in: criteria.lifecycleStage as any };
      } else {
        where.lifecycleStage = criteria.lifecycleStage as any;
      }
    }

    if (criteria.tags?.length) {
      where.tags = { hasSome: criteria.tags };
    }

    if (criteria.hasActiveMembership !== undefined) {
      if (criteria.hasActiveMembership) {
        where.memberships = { some: { status: 'ACTIVE' } };
      } else {
        where.memberships = { none: { status: 'ACTIVE' } };
      }
    }

    if (criteria.membershipTypeId) {
      where.memberships = {
        some: { membershipTypeId: criteria.membershipTypeId, status: 'ACTIVE' },
      };
    }

    if (criteria.minLeadScore !== undefined || criteria.maxLeadScore !== undefined) {
      where.leadScore = {};
      if (criteria.minLeadScore !== undefined) where.leadScore.gte = criteria.minLeadScore;
      if (criteria.maxLeadScore !== undefined) where.leadScore.lte = criteria.maxLeadScore;
    }

    if (criteria.joinedAfter) where.createdAt = { ...((where.createdAt as any) || {}), gte: new Date(criteria.joinedAfter) };
    if (criteria.joinedBefore) where.createdAt = { ...((where.createdAt as any) || {}), lte: new Date(criteria.joinedBefore) };

    if (criteria.lastActiveAfter) where.lastActiveAt = { ...((where.lastActiveAt as any) || {}), gte: new Date(criteria.lastActiveAfter) };
    if (criteria.lastActiveBefore) where.lastActiveAt = { ...((where.lastActiveAt as any) || {}), lte: new Date(criteria.lastActiveBefore) };

    return where;
  }
}

export const segmentService = new SegmentService();
