import { prisma } from '../config/database.js';
import { ClassType, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export interface CreateClassTypeInput {
  tenantId: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  defaultCapacity?: number;
  color?: string;
  imageUrl?: string;
}

export interface UpdateClassTypeInput {
  name?: string;
  description?: string;
  durationMinutes?: number;
  defaultCapacity?: number;
  color?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export class ClassTypeService {
  /**
   * Create a new class type
   */
  async create(input: CreateClassTypeInput): Promise<ClassType> {
    return prisma.classType.create({
      data: input,
    });
  }

  /**
   * Get class type by ID
   */
  async getById(id: string, tenantId: string): Promise<ClassType | null> {
    return prisma.classType.findFirst({
      where: { id, tenantId },
    });
  }

  /**
   * List all class types for a tenant
   */
  async list(tenantId: string, includeInactive = false): Promise<ClassType[]> {
    const where: Prisma.ClassTypeWhereInput = { tenantId };

    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.classType.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a class type
   */
  async update(id: string, tenantId: string, input: UpdateClassTypeInput): Promise<ClassType> {
    const classType = await prisma.classType.findFirst({
      where: { id, tenantId },
    });

    if (!classType) {
      throw new NotFoundError('Class type not found');
    }

    return prisma.classType.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Deactivate a class type
   */
  async deactivate(id: string, tenantId: string): Promise<ClassType> {
    const classType = await prisma.classType.findFirst({
      where: { id, tenantId },
    });

    if (!classType) {
      throw new NotFoundError('Class type not found');
    }

    // Check if there are future classes of this type
    const futureClasses = await prisma.classSession.count({
      where: {
        classTypeId: id,
        startTime: { gte: new Date() },
        status: 'SCHEDULED',
      },
    });

    if (futureClasses > 0) {
      throw new ConflictError(
        `Cannot deactivate class type with ${futureClasses} scheduled classes. Cancel them first.`
      );
    }

    return prisma.classType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get class type statistics
   */
  async getStats(id: string, tenantId: string) {
    const classType = await prisma.classType.findFirst({
      where: { id, tenantId },
    });

    if (!classType) {
      throw new NotFoundError('Class type not found');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalClasses, upcomingClasses, classesWithBookings] = await Promise.all([
      prisma.classSession.count({
        where: { classTypeId: id },
      }),
      prisma.classSession.count({
        where: {
          classTypeId: id,
          startTime: { gte: now },
          status: 'SCHEDULED',
        },
      }),
      prisma.classSession.findMany({
        where: {
          classTypeId: id,
          startTime: { gte: thirtyDaysAgo, lt: now },
        },
        select: {
          capacity: true,
          spotsBooked: true,
        },
      }),
    ]);

    // Calculate average fill rate
    let avgFillRate = 0;
    if (classesWithBookings.length > 0) {
      const totalFillRate = classesWithBookings.reduce((sum, c) => {
        return sum + (c.spotsBooked / c.capacity) * 100;
      }, 0);
      avgFillRate = totalFillRate / classesWithBookings.length;
    }

    return {
      totalClasses,
      upcomingClasses,
      classesLast30Days: classesWithBookings.length,
      avgFillRate: Math.round(avgFillRate * 10) / 10,
    };
  }
}

export const classTypeService = new ClassTypeService();
