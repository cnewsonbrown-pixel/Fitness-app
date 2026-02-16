import { prisma } from '../config/database.js';
import { Staff, StaffRole, PayType, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export interface CreateStaffInput {
  tenantId: string;
  userId: string;
  role: StaffRole;
  displayName: string;
  bio?: string;
  isInstructor?: boolean;
  payRate?: number;
  payType?: PayType;
  locationIds?: string[];
}

export interface UpdateStaffInput {
  role?: StaffRole;
  displayName?: string;
  bio?: string;
  isInstructor?: boolean;
  payRate?: number;
  payType?: PayType;
  isActive?: boolean;
  locationIds?: string[];
}

export interface StaffListFilters {
  tenantId: string;
  role?: StaffRole;
  isInstructor?: boolean;
  isActive?: boolean;
  locationId?: string;
}

const staffInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
    },
  },
  locations: {
    include: {
      location: {
        select: { id: true, name: true },
      },
    },
  },
};

export class StaffService {
  async create(input: CreateStaffInput): Promise<Staff> {
    const { tenantId, userId, role, displayName, bio, isInstructor, payRate, payType, locationIds } = input;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const existing = await prisma.staff.findFirst({ where: { userId, tenantId } });
    if (existing) throw new ConflictError('User is already a staff member for this studio');

    if (locationIds?.length) {
      const locations = await prisma.location.findMany({
        where: { id: { in: locationIds }, tenantId, isActive: true },
      });
      if (locations.length !== locationIds.length) {
        throw new BadRequestError('One or more locations not found');
      }
    }

    return prisma.staff.create({
      data: {
        tenantId,
        userId,
        role,
        displayName,
        bio,
        isInstructor: isInstructor || false,
        payRate: payRate ?? 0,
        payType: payType || PayType.PER_CLASS,
        locations: locationIds
          ? {
              create: locationIds.map((locId) => ({ locationId: locId })),
            }
          : undefined,
      },
    });
  }

  async getById(id: string, tenantId: string) {
    return prisma.staff.findFirst({
      where: { id, tenantId },
      include: staffInclude,
    });
  }

  async getByUserId(userId: string, tenantId: string) {
    return prisma.staff.findFirst({
      where: { userId, tenantId },
      include: staffInclude,
    });
  }

  async list(filters: StaffListFilters) {
    const { tenantId, role, isInstructor, isActive, locationId } = filters;

    const where: Prisma.StaffWhereInput = { tenantId };
    if (role) where.role = role;
    if (isInstructor !== undefined) where.isInstructor = isInstructor;
    if (isActive !== undefined) where.isActive = isActive;
    if (locationId) {
      where.locations = { some: { locationId } };
    }

    return prisma.staff.findMany({
      where,
      include: staffInclude,
      orderBy: { displayName: 'asc' },
    });
  }

  async listInstructors(tenantId: string, locationId?: string) {
    return this.list({ tenantId, isInstructor: true, isActive: true, locationId });
  }

  async update(id: string, tenantId: string, input: UpdateStaffInput): Promise<Staff> {
    const staff = await prisma.staff.findFirst({ where: { id, tenantId } });
    if (!staff) throw new NotFoundError('Staff member not found');

    const { locationIds, ...data } = input;

    if (locationIds) {
      const locations = await prisma.location.findMany({
        where: { id: { in: locationIds }, tenantId, isActive: true },
      });
      if (locations.length !== locationIds.length) {
        throw new BadRequestError('One or more locations not found');
      }
    }

    return prisma.$transaction(async (tx) => {
      if (locationIds) {
        await tx.staffLocation.deleteMany({ where: { staffId: id } });
        if (locationIds.length > 0) {
          await tx.staffLocation.createMany({
            data: locationIds.map((locId) => ({ staffId: id, locationId: locId })),
          });
        }
      }

      return tx.staff.update({
        where: { id },
        data,
      });
    });
  }

  async deactivate(id: string, tenantId: string): Promise<Staff> {
    const staff = await prisma.staff.findFirst({ where: { id, tenantId } });
    if (!staff) throw new NotFoundError('Staff member not found');

    if (staff.isInstructor) {
      const futureClasses = await prisma.classSession.count({
        where: { instructorId: id, startTime: { gte: new Date() }, status: 'SCHEDULED' },
      });
      if (futureClasses > 0) {
        throw new BadRequestError(
          `Cannot deactivate instructor with ${futureClasses} future scheduled classes. Reassign classes first.`
        );
      }
    }

    return prisma.staff.update({ where: { id }, data: { isActive: false } });
  }

  async canAccessLocation(staffId: string, locationId: string): Promise<boolean> {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { locations: true },
    });
    if (!staff) return false;
    if (staff.role === StaffRole.OWNER || staff.role === StaffRole.ADMIN) return true;
    return staff.locations.some((sl) => sl.locationId === locationId);
  }

  async getStats(tenantId: string) {
    const [total, byRole, instructors] = await Promise.all([
      prisma.staff.count({ where: { tenantId, isActive: true } }),
      prisma.staff.groupBy({
        by: ['role'],
        where: { tenantId, isActive: true },
        _count: true,
      }),
      prisma.staff.count({ where: { tenantId, isActive: true, isInstructor: true } }),
    ]);

    return {
      total,
      byRole: byRole.reduce(
        (acc, item) => { acc[item.role] = item._count; return acc; },
        {} as Record<string, number>
      ),
      instructors,
    };
  }
}

export const staffService = new StaffService();
