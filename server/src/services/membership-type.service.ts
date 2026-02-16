import { prisma } from '../config/database.js';
import { MembershipType, MembershipKind, BillingInterval, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export interface CreateMembershipTypeInput {
  tenantId: string;
  name: string;
  description?: string;
  type: MembershipKind;
  price: number;
  billingInterval?: BillingInterval;
  classCredits?: number;
  unlimitedClasses?: boolean;
  validLocationIds?: string[];
  validClassTypeIds?: string[];
  bookingWindowDays?: number;
  isPublic?: boolean;
}

export interface UpdateMembershipTypeInput {
  name?: string;
  description?: string;
  price?: number;
  billingInterval?: BillingInterval;
  classCredits?: number;
  unlimitedClasses?: boolean;
  validLocationIds?: string[];
  validClassTypeIds?: string[];
  bookingWindowDays?: number;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface MembershipTypeListFilters {
  tenantId: string;
  type?: MembershipKind;
  isActive?: boolean;
  isPublic?: boolean;
}

export class MembershipTypeService {
  /**
   * Create a new membership type
   */
  async create(input: CreateMembershipTypeInput): Promise<MembershipType> {
    const { tenantId, type, billingInterval, classCredits, ...data } = input;

    // Validate based on type
    if (type === MembershipKind.RECURRING && !billingInterval) {
      throw new BadRequestError('Billing interval is required for recurring memberships');
    }

    if (type === MembershipKind.CLASS_PACK && !classCredits) {
      throw new BadRequestError('Class credits are required for class pack memberships');
    }

    return prisma.membershipType.create({
      data: {
        tenantId,
        type,
        billingInterval: type === MembershipKind.RECURRING ? billingInterval : null,
        classCredits: type === MembershipKind.CLASS_PACK ? classCredits : null,
        ...data,
      },
    });
  }

  /**
   * Get membership type by ID
   */
  async getById(id: string, tenantId: string): Promise<MembershipType | null> {
    return prisma.membershipType.findFirst({
      where: { id, tenantId },
    });
  }

  /**
   * List membership types
   */
  async list(filters: MembershipTypeListFilters): Promise<MembershipType[]> {
    const { tenantId, type, isActive, isPublic } = filters;

    const where: Prisma.MembershipTypeWhereInput = { tenantId };

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    return prisma.membershipType.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get public membership types (for member signup page)
   */
  async getPublicMembershipTypes(tenantId: string): Promise<MembershipType[]> {
    return prisma.membershipType.findMany({
      where: {
        tenantId,
        isActive: true,
        isPublic: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Update membership type
   */
  async update(id: string, tenantId: string, input: UpdateMembershipTypeInput): Promise<MembershipType> {
    const membershipType = await prisma.membershipType.findFirst({
      where: { id, tenantId },
    });

    if (!membershipType) {
      throw new NotFoundError('Membership type not found');
    }

    return prisma.membershipType.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Deactivate membership type (soft delete)
   */
  async deactivate(id: string, tenantId: string): Promise<MembershipType> {
    const membershipType = await prisma.membershipType.findFirst({
      where: { id, tenantId },
    });

    if (!membershipType) {
      throw new NotFoundError('Membership type not found');
    }

    return prisma.membershipType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Check if membership is valid for a location
   */
  async isValidForLocation(membershipTypeId: string, locationId: string): Promise<boolean> {
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: membershipTypeId },
    });

    if (!membershipType) {
      return false;
    }

    // If no location restrictions, valid for all locations
    if (membershipType.validLocationIds.length === 0) {
      return true;
    }

    return membershipType.validLocationIds.includes(locationId);
  }

  /**
   * Check if membership is valid for a class type
   */
  async isValidForClassType(membershipTypeId: string, classTypeId: string): Promise<boolean> {
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: membershipTypeId },
    });

    if (!membershipType) {
      return false;
    }

    // If no class type restrictions, valid for all class types
    if (membershipType.validClassTypeIds.length === 0) {
      return true;
    }

    return membershipType.validClassTypeIds.includes(classTypeId);
  }

  /**
   * Get membership type statistics
   */
  async getStats(id: string, tenantId: string) {
    const membershipType = await prisma.membershipType.findFirst({
      where: { id, tenantId },
    });

    if (!membershipType) {
      throw new NotFoundError('Membership type not found');
    }

    const [totalMembers, activeMembers, revenue] = await Promise.all([
      prisma.memberMembership.count({
        where: { membershipTypeId: id },
      }),
      prisma.memberMembership.count({
        where: { membershipTypeId: id, status: 'ACTIVE' },
      }),
      prisma.memberMembership.count({
        where: { membershipTypeId: id, status: 'ACTIVE' },
      }).then((count) => count * Number(membershipType.price)),
    ]);

    return {
      totalMembers,
      activeMembers,
      estimatedMonthlyRevenue: revenue,
    };
  }
}

export const membershipTypeService = new MembershipTypeService();
