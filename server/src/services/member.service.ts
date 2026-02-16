import { prisma } from '../config/database.js';
import { Member, LifecycleStage, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export interface CreateMemberInput {
  tenantId: string;
  userId: string;
  phone?: string;
  dateOfBirth?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  preferredLocationId?: string;
  tags?: string[];
}

export interface UpdateMemberInput {
  phone?: string;
  dateOfBirth?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  preferredLocationId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface MemberListFilters {
  tenantId: string;
  search?: string;
  lifecycleStage?: LifecycleStage;
  tags?: string[];
  hasActiveMembership?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'lastName' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MemberWithUser extends Member {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    isEmailVerified: boolean;
  };
}

export class MemberService {
  /**
   * Create a new member profile for a user
   */
  async create(input: CreateMemberInput): Promise<Member> {
    const { tenantId, userId, ...memberData } = input;

    // Check if member already exists for this user in this tenant
    const existingMember = await prisma.member.findFirst({
      where: { tenantId, userId },
    });

    if (existingMember) {
      throw new ConflictError('Member profile already exists for this user');
    }

    return prisma.member.create({
      data: {
        tenantId,
        userId,
        ...memberData,
        lifecycleStage: LifecycleStage.LEAD,
      },
    });
  }

  /**
   * Get member by ID
   */
  async getById(memberId: string, tenantId: string): Promise<MemberWithUser | null> {
    return prisma.member.findFirst({
      where: { id: memberId, tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isEmailVerified: true,
          },
        },
      },
    }) as Promise<MemberWithUser | null>;
  }

  /**
   * Get member by user ID
   */
  async getByUserId(userId: string, tenantId: string): Promise<MemberWithUser | null> {
    return prisma.member.findFirst({
      where: { userId, tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isEmailVerified: true,
          },
        },
      },
    }) as Promise<MemberWithUser | null>;
  }

  /**
   * List members with filtering and pagination
   */
  async list(filters: MemberListFilters): Promise<{
    members: MemberWithUser[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const {
      tenantId,
      search,
      lifecycleStage,
      tags,
      hasActiveMembership,
      page = 1,
      perPage = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.MemberWhereInput = { tenantId };

    // Search by name or email
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Filter by lifecycle stage
    if (lifecycleStage) {
      where.lifecycleStage = lifecycleStage;
    }

    // Filter by tags (member must have ALL specified tags)
    if (tags && tags.length > 0) {
      where.tags = { hasEvery: tags };
    }

    // Filter by active membership
    if (hasActiveMembership !== undefined) {
      if (hasActiveMembership) {
        where.memberships = {
          some: { status: 'ACTIVE' },
        };
      } else {
        where.memberships = {
          none: { status: 'ACTIVE' },
        };
      }
    }

    // Build orderBy
    let orderBy: Prisma.MemberOrderByWithRelationInput;
    if (sortBy === 'lastName') {
      orderBy = { user: { lastName: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
              isEmailVerified: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.member.count({ where }),
    ]);

    return {
      members: members as MemberWithUser[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /**
   * Update member profile
   */
  async update(memberId: string, tenantId: string, input: UpdateMemberInput): Promise<Member> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    return prisma.member.update({
      where: { id: memberId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add tags to a member
   */
  async addTags(memberId: string, tenantId: string, tags: string[]): Promise<Member> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    const uniqueTags = [...new Set([...member.tags, ...tags])];

    return prisma.member.update({
      where: { id: memberId },
      data: { tags: uniqueTags },
    });
  }

  /**
   * Remove a tag from a member
   */
  async removeTag(memberId: string, tenantId: string, tag: string): Promise<Member> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    return prisma.member.update({
      where: { id: memberId },
      data: {
        tags: member.tags.filter((t) => t !== tag),
      },
    });
  }

  /**
   * Update lifecycle stage
   */
  async updateLifecycleStage(
    memberId: string,
    tenantId: string,
    stage: LifecycleStage
  ): Promise<Member> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    return prisma.member.update({
      where: { id: memberId },
      data: { lifecycleStage: stage },
    });
  }

  /**
   * Update lead score
   */
  async updateLeadScore(memberId: string, tenantId: string, score: number): Promise<Member> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    return prisma.member.update({
      where: { id: memberId },
      data: { leadScore: score },
    });
  }

  /**
   * Record member activity (updates lastActiveAt)
   */
  async recordActivity(memberId: string): Promise<void> {
    await prisma.member.update({
      where: { id: memberId },
      data: { lastActiveAt: new Date() },
    });
  }

  /**
   * Soft delete a member (deactivate user)
   */
  async delete(memberId: string, tenantId: string): Promise<void> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    // Deactivate the user account
    await prisma.user.update({
      where: { id: member.userId },
      data: { isActive: false },
    });

    // Update lifecycle stage to churned
    await prisma.member.update({
      where: { id: memberId },
      data: { lifecycleStage: LifecycleStage.CHURNED },
    });
  }

  /**
   * Get member statistics
   */
  async getMemberStats(memberId: string, tenantId: string) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    const [
      totalBookings,
      attendedClasses,
      upcomingBookings,
      activeMemberships,
    ] = await Promise.all([
      prisma.booking.count({
        where: { memberId },
      }),
      prisma.booking.count({
        where: { memberId, status: 'CHECKED_IN' },
      }),
      prisma.booking.count({
        where: {
          memberId,
          status: 'BOOKED',
          classSession: { startTime: { gte: new Date() } },
        },
      }),
      prisma.memberMembership.count({
        where: { memberId, status: 'ACTIVE' },
      }),
    ]);

    return {
      totalBookings,
      attendedClasses,
      upcomingBookings,
      activeMemberships,
      totalPoints: member.totalPoints,
      currentStreak: member.currentStreak,
      longestStreak: member.longestStreak,
      lifecycleStage: member.lifecycleStage,
      leadScore: member.leadScore,
    };
  }
}

export const memberService = new MemberService();
