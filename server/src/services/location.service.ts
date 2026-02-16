import { prisma } from '../config/database.js';
import { Location, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export interface CreateLocationInput {
  tenantId: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  timezone: string;
  phone?: string;
  email?: string;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export class LocationService {
  /**
   * Create a new location
   */
  async create(input: CreateLocationInput): Promise<Location> {
    return prisma.location.create({
      data: input,
    });
  }

  /**
   * Get location by ID
   */
  async getById(id: string, tenantId: string): Promise<Location | null> {
    return prisma.location.findFirst({
      where: { id, tenantId },
    });
  }

  /**
   * List all locations for a tenant
   */
  async list(tenantId: string, includeInactive = false): Promise<Location[]> {
    const where: Prisma.LocationWhereInput = { tenantId };

    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a location
   */
  async update(id: string, tenantId: string, input: UpdateLocationInput): Promise<Location> {
    const location = await prisma.location.findFirst({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    return prisma.location.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Deactivate a location
   */
  async deactivate(id: string, tenantId: string): Promise<Location> {
    const location = await prisma.location.findFirst({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    // Check if there are future classes scheduled at this location
    const futureClasses = await prisma.classSession.count({
      where: {
        locationId: id,
        startTime: { gte: new Date() },
        status: 'SCHEDULED',
      },
    });

    if (futureClasses > 0) {
      throw new ConflictError(
        `Cannot deactivate location with ${futureClasses} scheduled classes. Cancel or reschedule them first.`
      );
    }

    return prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get location statistics
   */
  async getStats(id: string, tenantId: string) {
    const location = await prisma.location.findFirst({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalClasses,
      upcomingClasses,
      totalBookings,
      checkedInBookings,
    ] = await Promise.all([
      prisma.classSession.count({
        where: { locationId: id },
      }),
      prisma.classSession.count({
        where: {
          locationId: id,
          startTime: { gte: now },
          status: 'SCHEDULED',
        },
      }),
      prisma.booking.count({
        where: {
          classSession: {
            locationId: id,
            startTime: { gte: thirtyDaysAgo },
          },
        },
      }),
      prisma.booking.count({
        where: {
          classSession: {
            locationId: id,
            startTime: { gte: thirtyDaysAgo },
          },
          status: 'CHECKED_IN',
        },
      }),
    ]);

    return {
      totalClasses,
      upcomingClasses,
      bookingsLast30Days: totalBookings,
      checkInsLast30Days: checkedInBookings,
      attendanceRate: totalBookings > 0 ? (checkedInBookings / totalBookings) * 100 : 0,
    };
  }
}

export const locationService = new LocationService();
