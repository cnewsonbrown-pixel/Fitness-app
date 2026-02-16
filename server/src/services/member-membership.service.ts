import { prisma } from '../config/database.js';
import {
  MemberMembership,
  MembershipStatus,
  MembershipKind,
  LifecycleStage,
  Prisma,
} from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export interface CreateMemberMembershipInput {
  memberId: string;
  membershipTypeId: string;
  startDate?: Date;
  stripeSubscriptionId?: string;
}

export interface MemberMembershipWithType extends MemberMembership {
  membershipType: {
    id: string;
    name: string;
    type: MembershipKind;
    price: number;
    billingInterval: string | null;
    classCredits: number | null;
    unlimitedClasses: boolean;
  };
}

export interface MemberMembershipListFilters {
  memberId?: string;
  tenantId?: string;
  status?: MembershipStatus;
  membershipTypeId?: string;
}

export class MemberMembershipService {
  /**
   * Create a new membership for a member
   */
  async create(input: CreateMemberMembershipInput): Promise<MemberMembership> {
    const { memberId, membershipTypeId, startDate = new Date(), stripeSubscriptionId } = input;

    // Get the membership type
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: membershipTypeId },
    });

    if (!membershipType) {
      throw new NotFoundError('Membership type not found');
    }

    if (!membershipType.isActive) {
      throw new BadRequestError('This membership type is no longer available');
    }

    // Get the member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    // Check if member already has an active membership of the same type
    const existingMembership = await prisma.memberMembership.findFirst({
      where: {
        memberId,
        membershipTypeId,
        status: 'ACTIVE',
      },
    });

    if (existingMembership) {
      throw new ConflictError('Member already has an active membership of this type');
    }

    // Calculate period end based on membership type
    const periodEnd = this.calculatePeriodEnd(startDate, membershipType);

    // Create the membership
    const membership = await prisma.memberMembership.create({
      data: {
        memberId,
        membershipTypeId,
        status: MembershipStatus.ACTIVE,
        stripeSubscriptionId,
        currentPeriodStart: startDate,
        currentPeriodEnd: periodEnd,
        startDate,
        creditsRemaining:
          membershipType.type === MembershipKind.CLASS_PACK
            ? membershipType.classCredits
            : null,
      },
    });

    // Update member lifecycle stage to ACTIVE if they were a lead or trial
    if (
      member.lifecycleStage === LifecycleStage.LEAD ||
      member.lifecycleStage === LifecycleStage.TRIAL
    ) {
      await prisma.member.update({
        where: { id: memberId },
        data: { lifecycleStage: LifecycleStage.ACTIVE },
      });
    }

    return membership;
  }

  /**
   * Get membership by ID
   */
  async getById(id: string): Promise<MemberMembershipWithType | null> {
    return prisma.memberMembership.findUnique({
      where: { id },
      include: {
        membershipType: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            billingInterval: true,
            classCredits: true,
            unlimitedClasses: true,
          },
        },
      },
    }) as Promise<MemberMembershipWithType | null>;
  }

  /**
   * List memberships for a member
   */
  async listByMember(memberId: string): Promise<MemberMembershipWithType[]> {
    return prisma.memberMembership.findMany({
      where: { memberId },
      include: {
        membershipType: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            billingInterval: true,
            classCredits: true,
            unlimitedClasses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<MemberMembershipWithType[]>;
  }

  /**
   * Get active memberships for a member
   */
  async getActiveMemberships(memberId: string): Promise<MemberMembershipWithType[]> {
    return prisma.memberMembership.findMany({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        membershipType: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            billingInterval: true,
            classCredits: true,
            unlimitedClasses: true,
          },
        },
      },
    }) as Promise<MemberMembershipWithType[]>;
  }

  /**
   * Pause a membership
   */
  async pause(id: string, memberId: string): Promise<MemberMembership> {
    const membership = await prisma.memberMembership.findFirst({
      where: { id, memberId, status: MembershipStatus.ACTIVE },
    });

    if (!membership) {
      throw new NotFoundError('Active membership not found');
    }

    return prisma.memberMembership.update({
      where: { id },
      data: {
        status: MembershipStatus.PAUSED,
        pausedAt: new Date(),
      },
    });
  }

  /**
   * Resume a paused membership
   */
  async resume(id: string, memberId: string): Promise<MemberMembership> {
    const membership = await prisma.memberMembership.findFirst({
      where: { id, memberId, status: MembershipStatus.PAUSED },
      include: { membershipType: true },
    });

    if (!membership) {
      throw new NotFoundError('Paused membership not found');
    }

    // Calculate remaining days when paused
    const pausedAt = membership.pausedAt!;
    const periodEnd = membership.currentPeriodEnd;
    const remainingMs = periodEnd.getTime() - pausedAt.getTime();

    // New period end = now + remaining time
    const newPeriodEnd = new Date(Date.now() + remainingMs);

    return prisma.memberMembership.update({
      where: { id },
      data: {
        status: MembershipStatus.ACTIVE,
        pausedAt: null,
        currentPeriodEnd: newPeriodEnd,
      },
    });
  }

  /**
   * Cancel a membership
   */
  async cancel(id: string, memberId: string, reason?: string): Promise<MemberMembership> {
    const membership = await prisma.memberMembership.findFirst({
      where: {
        id,
        memberId,
        status: { in: [MembershipStatus.ACTIVE, MembershipStatus.PAUSED] },
      },
    });

    if (!membership) {
      throw new NotFoundError('Membership not found');
    }

    const cancelled = await prisma.memberMembership.update({
      where: { id },
      data: {
        status: MembershipStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        endDate: new Date(),
      },
    });

    // Check if member has any other active memberships
    const otherActiveMemberships = await prisma.memberMembership.count({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
        id: { not: id },
      },
    });

    // If no other active memberships, mark member as at risk
    if (otherActiveMemberships === 0) {
      await prisma.member.update({
        where: { id: memberId },
        data: { lifecycleStage: LifecycleStage.AT_RISK },
      });
    }

    return cancelled;
  }

  /**
   * Use a credit from a class pack membership
   */
  async useCredit(memberId: string, classSessionId: string): Promise<MemberMembership | null> {
    // Find an active class pack membership with remaining credits
    const membership = await prisma.memberMembership.findFirst({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
        creditsRemaining: { gt: 0 },
        membershipType: {
          type: MembershipKind.CLASS_PACK,
        },
      },
      include: { membershipType: true },
      orderBy: { currentPeriodEnd: 'asc' }, // Use credits from membership expiring soonest
    });

    if (!membership) {
      return null;
    }

    // Check if class type is valid for this membership
    // (Simplified - in production you'd check against classSession's classTypeId)

    // Deduct a credit
    const updated = await prisma.memberMembership.update({
      where: { id: membership.id },
      data: {
        creditsRemaining: { decrement: 1 },
        creditsUsed: { increment: 1 },
      },
    });

    // If no credits remaining, expire the membership
    if (updated.creditsRemaining === 0) {
      await prisma.memberMembership.update({
        where: { id: membership.id },
        data: {
          status: MembershipStatus.EXPIRED,
          endDate: new Date(),
        },
      });
    }

    return updated;
  }

  /**
   * Check if member can book a class
   */
  async canBookClass(
    memberId: string,
    classTypeId: string,
    locationId: string
  ): Promise<{ canBook: boolean; membership?: MemberMembershipWithType; reason?: string }> {
    // Get active memberships
    const memberships = await prisma.memberMembership.findMany({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        membershipType: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            billingInterval: true,
            classCredits: true,
            unlimitedClasses: true,
            validLocationIds: true,
            validClassTypeIds: true,
          },
        },
      },
    });

    if (memberships.length === 0) {
      return { canBook: false, reason: 'No active membership' };
    }

    // Find a valid membership
    for (const membership of memberships) {
      const mt = membership.membershipType;

      // Check location restriction
      if (mt.validLocationIds.length > 0 && !mt.validLocationIds.includes(locationId)) {
        continue;
      }

      // Check class type restriction
      if (mt.validClassTypeIds.length > 0 && !mt.validClassTypeIds.includes(classTypeId)) {
        continue;
      }

      // Check credits for class packs
      if (mt.type === MembershipKind.CLASS_PACK) {
        if ((membership.creditsRemaining ?? 0) <= 0) {
          continue;
        }
      }

      // Found a valid membership
      return {
        canBook: true,
        membership: membership as unknown as MemberMembershipWithType,
      };
    }

    return {
      canBook: false,
      reason: 'No membership valid for this class',
    };
  }

  /**
   * Renew a recurring membership (called by billing webhook)
   */
  async renew(id: string): Promise<MemberMembership> {
    const membership = await prisma.memberMembership.findUnique({
      where: { id },
      include: { membershipType: true },
    });

    if (!membership) {
      throw new NotFoundError('Membership not found');
    }

    const newPeriodStart = membership.currentPeriodEnd;
    const newPeriodEnd = this.calculatePeriodEnd(newPeriodStart, membership.membershipType);

    return prisma.memberMembership.update({
      where: { id },
      data: {
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        status: MembershipStatus.ACTIVE, // Reactivate if was expired
      },
    });
  }

  /**
   * Calculate period end date based on membership type
   */
  private calculatePeriodEnd(
    startDate: Date,
    membershipType: { type: MembershipKind; billingInterval: string | null }
  ): Date {
    const end = new Date(startDate);

    if (membershipType.type === MembershipKind.DROP_IN) {
      // Drop-in valid for 24 hours
      end.setHours(end.getHours() + 24);
    } else if (membershipType.type === MembershipKind.CLASS_PACK) {
      // Class packs valid for 1 year by default
      end.setFullYear(end.getFullYear() + 1);
    } else {
      // Recurring based on billing interval
      switch (membershipType.billingInterval) {
        case 'WEEKLY':
          end.setDate(end.getDate() + 7);
          break;
        case 'MONTHLY':
          end.setMonth(end.getMonth() + 1);
          break;
        case 'YEARLY':
          end.setFullYear(end.getFullYear() + 1);
          break;
        default:
          end.setMonth(end.getMonth() + 1);
      }
    }

    return end;
  }
}

export const memberMembershipService = new MemberMembershipService();
