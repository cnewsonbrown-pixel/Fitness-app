import { prisma } from '../config/database.js';
import { InstructorAvailability, Certification, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export interface CreateAvailabilityInput {
  instructorId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string;
  locationId?: string;
}

export interface CreateOverrideInput {
  instructorId: string;
  date: Date;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface CreateCertificationInput {
  staffId: string;
  name: string;
  issuingBody: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
}

export interface PayPeriodInput {
  instructorId: string;
  startDate: Date;
  endDate: Date;
}

export class InstructorService {
  // ============================================
  // AVAILABILITY MANAGEMENT
  // ============================================

  async setAvailability(input: CreateAvailabilityInput): Promise<InstructorAvailability> {
    const { instructorId, dayOfWeek, startTime, endTime, locationId } = input;

    const staff = await prisma.staff.findUnique({ where: { id: instructorId } });
    if (!staff || !staff.isInstructor) {
      throw new NotFoundError('Instructor not found');
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestError('Day of week must be 0-6');
    }

    // Upsert based on unique constraint
    return prisma.instructorAvailability.upsert({
      where: {
        instructorId_dayOfWeek_locationId: {
          instructorId,
          dayOfWeek,
          locationId: locationId || null as any,
        },
      },
      update: { startTime, endTime },
      create: { instructorId, dayOfWeek, startTime, endTime, locationId },
    });
  }

  async getAvailability(instructorId: string): Promise<InstructorAvailability[]> {
    return prisma.instructorAvailability.findMany({
      where: { instructorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async removeAvailability(id: string, instructorId: string): Promise<void> {
    const slot = await prisma.instructorAvailability.findFirst({ where: { id, instructorId } });
    if (!slot) throw new NotFoundError('Availability slot not found');
    await prisma.instructorAvailability.delete({ where: { id } });
  }

  async setOverride(input: CreateOverrideInput): Promise<void> {
    const { instructorId, date, isAvailable, startTime, endTime, reason } = input;

    const staff = await prisma.staff.findUnique({ where: { id: instructorId } });
    if (!staff || !staff.isInstructor) {
      throw new NotFoundError('Instructor not found');
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    await prisma.instructorOverride.upsert({
      where: {
        instructorId_date: { instructorId, date: normalizedDate },
      },
      update: { isAvailable, startTime, endTime, reason },
      create: { instructorId, date: normalizedDate, isAvailable, startTime, endTime, reason },
    });
  }

  async getOverrides(instructorId: string, startDate: Date, endDate: Date) {
    return prisma.instructorOverride.findMany({
      where: {
        instructorId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async isAvailable(instructorId: string, date: Date, startTime: string, endTime: string): Promise<boolean> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const override = await prisma.instructorOverride.findUnique({
      where: { instructorId_date: { instructorId, date: normalizedDate } },
    });

    if (override) {
      if (!override.isAvailable) return false;
      if (override.startTime && override.endTime) {
        return startTime >= override.startTime && endTime <= override.endTime;
      }
      return true;
    }

    const dayOfWeek = date.getDay();
    const availability = await prisma.instructorAvailability.findFirst({
      where: { instructorId, dayOfWeek },
    });

    if (!availability) return false;
    return startTime >= availability.startTime && endTime <= availability.endTime;
  }

  // ============================================
  // CERTIFICATION MANAGEMENT
  // ============================================

  async addCertification(input: CreateCertificationInput): Promise<Certification> {
    const { staffId, name, issuingBody, issueDate, expiryDate, documentUrl } = input;

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff || !staff.isInstructor) throw new NotFoundError('Instructor not found');

    return prisma.certification.create({
      data: { staffId, name, issuingBody, issueDate, expiryDate, documentUrl },
    });
  }

  async getCertifications(staffId: string): Promise<Certification[]> {
    return prisma.certification.findMany({
      where: { staffId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async updateCertification(id: string, staffId: string, data: Partial<CreateCertificationInput>): Promise<Certification> {
    const cert = await prisma.certification.findFirst({ where: { id, staffId } });
    if (!cert) throw new NotFoundError('Certification not found');

    const { staffId: _, ...updateData } = data;
    return prisma.certification.update({ where: { id }, data: updateData });
  }

  async removeCertification(id: string, staffId: string): Promise<void> {
    const cert = await prisma.certification.findFirst({ where: { id, staffId } });
    if (!cert) throw new NotFoundError('Certification not found');
    await prisma.certification.delete({ where: { id } });
  }

  async getExpiringCertifications(tenantId: string, daysAhead = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return prisma.certification.findMany({
      where: {
        staff: { tenantId },
        expiryDate: { lte: expiryDate, gte: new Date() },
      },
      include: {
        staff: {
          select: { id: true, displayName: true, user: { select: { email: true } } },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ============================================
  // COMPENSATION & SCHEDULE
  // ============================================

  async getPaySummary(input: PayPeriodInput) {
    const { instructorId, startDate, endDate } = input;

    const instructor = await prisma.staff.findUnique({ where: { id: instructorId } });
    if (!instructor || !instructor.isInstructor) throw new NotFoundError('Instructor not found');

    const classes = await prisma.classSession.findMany({
      where: {
        instructorId,
        status: 'COMPLETED',
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        classType: { select: { name: true, durationMinutes: true } },
        location: { select: { name: true } },
        _count: { select: { bookings: { where: { status: 'CHECKED_IN' } } } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Check for class-specific pay rates
    const payRates = await prisma.payRate.findMany({
      where: {
        staffId: instructorId,
        effectiveFrom: { lte: endDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
      },
    });

    const defaultRate = Number(instructor.payRate);
    const totalClasses = classes.length;

    const classDetails = classes.map((c) => {
      // Find specific rate for this class type/location
      const specificRate = payRates.find(
        (r) =>
          (r.classTypeId === c.classTypeId || !r.classTypeId) &&
          (r.locationId === c.locationId || !r.locationId)
      );
      const rate = specificRate ? Number(specificRate.amount) : defaultRate;

      return {
        id: c.id,
        className: c.classType.name,
        location: c.location.name,
        date: c.startTime,
        duration: c.classType.durationMinutes,
        attendees: c._count.bookings,
        rate,
      };
    });

    const totalEarnings = classDetails.reduce((sum, c) => sum + c.rate, 0);

    return {
      instructor: { id: instructor.id, displayName: instructor.displayName },
      period: { startDate, endDate },
      summary: { totalClasses, totalEarnings, defaultRate },
      classes: classDetails,
    };
  }

  async getSchedule(instructorId: string, startDate: Date, endDate: Date) {
    return prisma.classSession.findMany({
      where: {
        instructorId,
        startTime: { gte: startDate, lte: endDate },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        classType: { select: { id: true, name: true, color: true, durationMinutes: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getMetrics(instructorId: string, startDate: Date, endDate: Date) {
    const [classes, bookings, checkIns] = await Promise.all([
      prisma.classSession.count({
        where: { instructorId, startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
      }),
      prisma.booking.count({
        where: {
          classSession: { instructorId, startTime: { gte: startDate, lte: endDate } },
          status: { in: ['BOOKED', 'CHECKED_IN'] },
        },
      }),
      prisma.booking.count({
        where: {
          classSession: { instructorId, startTime: { gte: startDate, lte: endDate } },
          status: 'CHECKED_IN',
        },
      }),
    ]);

    return {
      classesTaught: classes,
      totalBookings: bookings,
      totalCheckIns: checkIns,
      attendanceRate: bookings > 0 ? Math.round((checkIns / bookings) * 100) : 0,
      averageClassSize: classes > 0 ? Math.round(checkIns / classes) : 0,
    };
  }
}

export const instructorService = new InstructorService();
