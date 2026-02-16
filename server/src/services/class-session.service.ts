import { prisma } from '../config/database.js';
import { ClassSession, ClassStatus, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export interface CreateClassSessionInput {
  tenantId: string;
  locationId: string;
  classTypeId: string;
  instructorId: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
}

export interface UpdateClassSessionInput {
  instructorId?: string;
  startTime?: Date;
  endTime?: Date;
  capacity?: number;
}

export interface ClassSessionListFilters {
  tenantId: string;
  locationId?: string;
  classTypeId?: string;
  instructorId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ClassStatus;
}

export interface ClassSessionWithDetails extends ClassSession {
  classType: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    color: string;
  };
  location: {
    id: string;
    name: string;
    timezone: string;
  };
  instructor: {
    id: string;
    displayName: string;
    user: {
      profileImageUrl: string | null;
    };
  };
}

export class ClassSessionService {
  /**
   * Create a new class session
   */
  async create(input: CreateClassSessionInput): Promise<ClassSession> {
    const { tenantId, locationId, classTypeId, instructorId, startTime, endTime, capacity } = input;

    // Validate location exists and belongs to tenant
    const location = await prisma.location.findFirst({
      where: { id: locationId, tenantId, isActive: true },
    });
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    // Validate class type exists and belongs to tenant
    const classType = await prisma.classType.findFirst({
      where: { id: classTypeId, tenantId, isActive: true },
    });
    if (!classType) {
      throw new NotFoundError('Class type not found');
    }

    // Validate instructor exists and belongs to tenant
    const instructor = await prisma.staff.findFirst({
      where: { id: instructorId, tenantId, isActive: true, isInstructor: true },
    });
    if (!instructor) {
      throw new NotFoundError('Instructor not found');
    }

    // Check for instructor conflicts
    const conflictingClass = await prisma.classSession.findFirst({
      where: {
        instructorId,
        status: ClassStatus.SCHEDULED,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (conflictingClass) {
      throw new ConflictError('Instructor has a conflicting class at this time');
    }

    return prisma.classSession.create({
      data: {
        tenantId,
        locationId,
        classTypeId,
        instructorId,
        startTime,
        endTime,
        capacity,
        status: ClassStatus.SCHEDULED,
      },
    });
  }

  /**
   * Get class session by ID
   */
  async getById(id: string, tenantId: string): Promise<ClassSessionWithDetails | null> {
    return prisma.classSession.findFirst({
      where: { id, tenantId },
      include: {
        classType: {
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            color: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
      },
    }) as Promise<ClassSessionWithDetails | null>;
  }

  /**
   * List class sessions with filters
   */
  async list(filters: ClassSessionListFilters): Promise<ClassSessionWithDetails[]> {
    const { tenantId, locationId, classTypeId, instructorId, startDate, endDate, status } = filters;

    const where: Prisma.ClassSessionWhereInput = { tenantId };

    if (locationId) where.locationId = locationId;
    if (classTypeId) where.classTypeId = classTypeId;
    if (instructorId) where.instructorId = instructorId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    return prisma.classSession.findMany({
      where,
      include: {
        classType: {
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            color: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    }) as Promise<ClassSessionWithDetails[]>;
  }

  /**
   * Get schedule for a week
   */
  async getWeeklySchedule(
    tenantId: string,
    startOfWeek: Date,
    locationId?: string
  ): Promise<ClassSessionWithDetails[]> {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return this.list({
      tenantId,
      locationId,
      startDate: startOfWeek,
      endDate: endOfWeek,
      status: ClassStatus.SCHEDULED,
    });
  }

  /**
   * Update a class session
   */
  async update(
    id: string,
    tenantId: string,
    input: UpdateClassSessionInput
  ): Promise<ClassSession> {
    const classSession = await prisma.classSession.findFirst({
      where: { id, tenantId },
    });

    if (!classSession) {
      throw new NotFoundError('Class session not found');
    }

    if (classSession.status !== ClassStatus.SCHEDULED) {
      throw new BadRequestError('Can only update scheduled classes');
    }

    // If changing instructor, check for conflicts
    if (input.instructorId && input.instructorId !== classSession.instructorId) {
      const startTime = input.startTime || classSession.startTime;
      const endTime = input.endTime || classSession.endTime;

      const conflictingClass = await prisma.classSession.findFirst({
        where: {
          id: { not: id },
          instructorId: input.instructorId,
          status: ClassStatus.SCHEDULED,
          OR: [
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
          ],
        },
      });

      if (conflictingClass) {
        throw new ConflictError('Instructor has a conflicting class at this time');
      }
    }

    return prisma.classSession.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Cancel a class session
   */
  async cancel(id: string, tenantId: string, reason?: string): Promise<ClassSession> {
    const classSession = await prisma.classSession.findFirst({
      where: { id, tenantId },
      include: { bookings: true },
    });

    if (!classSession) {
      throw new NotFoundError('Class session not found');
    }

    if (classSession.status !== ClassStatus.SCHEDULED) {
      throw new BadRequestError('Can only cancel scheduled classes');
    }

    // Cancel all bookings for this class
    await prisma.booking.updateMany({
      where: {
        classSessionId: id,
        status: { in: ['BOOKED', 'WAITLISTED'] },
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // TODO: Send cancellation notifications to all booked members

    return prisma.classSession.update({
      where: { id },
      data: {
        status: ClassStatus.CANCELLED,
        cancellationReason: reason,
      },
    });
  }

  /**
   * Mark class as in progress
   */
  async startClass(id: string, tenantId: string): Promise<ClassSession> {
    const classSession = await prisma.classSession.findFirst({
      where: { id, tenantId, status: ClassStatus.SCHEDULED },
    });

    if (!classSession) {
      throw new NotFoundError('Scheduled class session not found');
    }

    return prisma.classSession.update({
      where: { id },
      data: { status: ClassStatus.IN_PROGRESS },
    });
  }

  /**
   * Mark class as completed and handle no-shows
   */
  async completeClass(id: string, tenantId: string): Promise<ClassSession> {
    const classSession = await prisma.classSession.findFirst({
      where: { id, tenantId },
    });

    if (!classSession) {
      throw new NotFoundError('Class session not found');
    }

    // Mark any booked (not checked in) members as no-shows
    await prisma.booking.updateMany({
      where: {
        classSessionId: id,
        status: 'BOOKED',
      },
      data: {
        status: 'NO_SHOW',
      },
    });

    return prisma.classSession.update({
      where: { id },
      data: { status: ClassStatus.COMPLETED },
    });
  }

  /**
   * Get class roster
   */
  async getRoster(id: string, tenantId: string) {
    const classSession = await prisma.classSession.findFirst({
      where: { id, tenantId },
    });

    if (!classSession) {
      throw new NotFoundError('Class session not found');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        classSessionId: id,
        status: { in: ['BOOKED', 'CHECKED_IN'] },
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { bookedAt: 'asc' },
    });

    return bookings.map((b) => ({
      bookingId: b.id,
      memberId: b.memberId,
      firstName: b.member.user.firstName,
      lastName: b.member.user.lastName,
      email: b.member.user.email,
      profileImageUrl: b.member.user.profileImageUrl,
      status: b.status,
      bookedAt: b.bookedAt,
      checkedInAt: b.checkedInAt,
    }));
  }

  /**
   * Get waitlist for a class
   */
  async getWaitlist(id: string, tenantId: string) {
    const classSession = await prisma.classSession.findFirst({
      where: { id, tenantId },
    });

    if (!classSession) {
      throw new NotFoundError('Class session not found');
    }

    const waitlist = await prisma.booking.findMany({
      where: {
        classSessionId: id,
        status: 'WAITLISTED',
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { waitlistPosition: 'asc' },
    });

    return waitlist.map((b) => ({
      bookingId: b.id,
      memberId: b.memberId,
      firstName: b.member.user.firstName,
      lastName: b.member.user.lastName,
      email: b.member.user.email,
      position: b.waitlistPosition,
      joinedAt: b.bookedAt,
    }));
  }
}

export const classSessionService = new ClassSessionService();
