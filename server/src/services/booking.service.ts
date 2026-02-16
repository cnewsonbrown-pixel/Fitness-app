import { prisma } from '../config/database.js';
import { Booking, BookingStatus, ClassStatus, MembershipKind } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { memberMembershipService } from './member-membership.service.js';

export interface CreateBookingInput {
  memberId: string;
  classSessionId: string;
}

export interface BookingWithDetails extends Booking {
  classSession: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: ClassStatus;
    classType: {
      id: string;
      name: string;
      color: string;
    };
    location: {
      id: string;
      name: string;
    };
    instructor: {
      displayName: string;
    };
  };
}

export class BookingService {
  /**
   * Book a class for a member
   */
  async book(input: CreateBookingInput): Promise<Booking> {
    const { memberId, classSessionId } = input;

    // Get the class session with details
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        classType: true,
        location: true,
      },
    });

    if (!classSession) {
      throw new NotFoundError('Class session not found');
    }

    if (classSession.status !== ClassStatus.SCHEDULED) {
      throw new BadRequestError('Cannot book a class that is not scheduled');
    }

    if (classSession.startTime <= new Date()) {
      throw new BadRequestError('Cannot book a class that has already started');
    }

    // Check if member already has a booking for this class
    const existingBooking = await prisma.booking.findUnique({
      where: {
        memberId_classSessionId: {
          memberId,
          classSessionId,
        },
      },
    });

    if (existingBooking) {
      if (existingBooking.status === 'CANCELLED') {
        // Allow rebooking a cancelled booking
      } else {
        throw new ConflictError('You already have a booking for this class');
      }
    }

    // Check if member has a valid membership
    const membershipCheck = await memberMembershipService.canBookClass(
      memberId,
      classSession.classTypeId,
      classSession.locationId
    );

    if (!membershipCheck.canBook) {
      throw new BadRequestError(membershipCheck.reason || 'No valid membership for this class');
    }

    // Determine if booking or waitlist
    const isWaitlist = classSession.spotsBooked >= classSession.capacity;

    if (isWaitlist && !classSession.tenantId) {
      // Check tenant settings for waitlist (simplified - assume enabled)
    }

    // Create or update booking
    let booking: Booking;

    if (existingBooking && existingBooking.status === 'CANCELLED') {
      // Reactivate cancelled booking
      if (isWaitlist) {
        const waitlistPosition = classSession.waitlistCount + 1;
        booking = await prisma.booking.update({
          where: { id: existingBooking.id },
          data: {
            status: BookingStatus.WAITLISTED,
            waitlistPosition,
            bookedAt: new Date(),
            cancelledAt: null,
          },
        });
        await prisma.classSession.update({
          where: { id: classSessionId },
          data: { waitlistCount: { increment: 1 } },
        });
      } else {
        booking = await prisma.booking.update({
          where: { id: existingBooking.id },
          data: {
            status: BookingStatus.BOOKED,
            waitlistPosition: null,
            bookedAt: new Date(),
            cancelledAt: null,
            creditDeducted: membershipCheck.membership?.membershipType.type === MembershipKind.CLASS_PACK,
            memberMembershipId: membershipCheck.membership?.id,
          },
        });
        await prisma.classSession.update({
          where: { id: classSessionId },
          data: { spotsBooked: { increment: 1 } },
        });

        // Deduct credit if class pack
        if (membershipCheck.membership?.membershipType.type === MembershipKind.CLASS_PACK) {
          await memberMembershipService.useCredit(memberId, classSessionId);
        }
      }
    } else {
      // Create new booking
      if (isWaitlist) {
        const waitlistPosition = classSession.waitlistCount + 1;
        booking = await prisma.booking.create({
          data: {
            memberId,
            classSessionId,
            status: BookingStatus.WAITLISTED,
            waitlistPosition,
          },
        });
        await prisma.classSession.update({
          where: { id: classSessionId },
          data: { waitlistCount: { increment: 1 } },
        });
      } else {
        booking = await prisma.booking.create({
          data: {
            memberId,
            classSessionId,
            status: BookingStatus.BOOKED,
            creditDeducted: membershipCheck.membership?.membershipType.type === MembershipKind.CLASS_PACK,
            memberMembershipId: membershipCheck.membership?.id,
          },
        });
        await prisma.classSession.update({
          where: { id: classSessionId },
          data: { spotsBooked: { increment: 1 } },
        });

        // Deduct credit if class pack
        if (membershipCheck.membership?.membershipType.type === MembershipKind.CLASS_PACK) {
          await memberMembershipService.useCredit(memberId, classSessionId);
        }
      }
    }

    return booking;
  }

  /**
   * Cancel a booking
   */
  async cancel(bookingId: string, memberId: string): Promise<Booking> {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, memberId },
      include: {
        classSession: true,
        memberMembership: {
          include: { membershipType: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.CHECKED_IN) {
      throw new BadRequestError('Cannot cancel after check-in');
    }

    const wasBooked = booking.status === BookingStatus.BOOKED;
    const wasWaitlisted = booking.status === BookingStatus.WAITLISTED;

    // Update booking status
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Update class session counts
    if (wasBooked) {
      await prisma.classSession.update({
        where: { id: booking.classSessionId },
        data: { spotsBooked: { decrement: 1 } },
      });

      // Refund credit if class pack and within cancellation window
      if (booking.creditDeducted && booking.memberMembershipId) {
        // Check cancellation window (e.g., 12 hours before class)
        const cancellationWindowHours = 12;
        const cancellationDeadline = new Date(
          booking.classSession.startTime.getTime() - cancellationWindowHours * 60 * 60 * 1000
        );

        if (new Date() < cancellationDeadline) {
          await prisma.memberMembership.update({
            where: { id: booking.memberMembershipId },
            data: {
              creditsRemaining: { increment: 1 },
              creditsUsed: { decrement: 1 },
            },
          });
        }
      }

      // Promote from waitlist
      await this.promoteFromWaitlist(booking.classSessionId);
    } else if (wasWaitlisted) {
      await prisma.classSession.update({
        where: { id: booking.classSessionId },
        data: { waitlistCount: { decrement: 1 } },
      });

      // Reorder waitlist positions
      await this.reorderWaitlist(booking.classSessionId);
    }

    return cancelledBooking;
  }

  /**
   * Check in a member to a class
   */
  async checkIn(
    bookingId: string,
    method: 'QR_SCAN' | 'MANUAL' | 'AUTO' = 'MANUAL'
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { classSession: true },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== BookingStatus.BOOKED) {
      throw new BadRequestError('Can only check in booked members');
    }

    // Check if class is happening (within reasonable window)
    const now = new Date();
    const classStart = booking.classSession.startTime;
    const classEnd = booking.classSession.endTime;

    // Allow check-in 30 minutes before to end of class
    const checkInWindowStart = new Date(classStart.getTime() - 30 * 60 * 1000);

    if (now < checkInWindowStart) {
      throw new BadRequestError('Check-in is not yet open for this class');
    }

    if (now > classEnd) {
      throw new BadRequestError('Check-in window has closed');
    }

    // Update booking and member stats
    const [updatedBooking] = await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkedInAt: now,
          checkInMethod: method,
        },
      }),
      // Update member's last active and streak
      prisma.member.update({
        where: { id: booking.memberId },
        data: {
          lastActiveAt: now,
          // Streak logic would be more complex in reality
        },
      }),
    ]);

    return updatedBooking;
  }

  /**
   * Check in by QR code (member ID lookup)
   */
  async checkInByQR(
    memberId: string,
    classSessionId: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: {
        memberId_classSessionId: {
          memberId,
          classSessionId,
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('No booking found for this member and class');
    }

    return this.checkIn(booking.id, 'QR_SCAN');
  }

  /**
   * Get booking by ID
   */
  async getById(bookingId: string): Promise<BookingWithDetails | null> {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classSession: {
          include: {
            classType: {
              select: { id: true, name: true, color: true },
            },
            location: {
              select: { id: true, name: true },
            },
            instructor: {
              select: { displayName: true },
            },
          },
        },
      },
    }) as Promise<BookingWithDetails | null>;
  }

  /**
   * Get upcoming bookings for a member
   */
  async getUpcoming(memberId: string): Promise<BookingWithDetails[]> {
    return prisma.booking.findMany({
      where: {
        memberId,
        status: { in: [BookingStatus.BOOKED, BookingStatus.WAITLISTED] },
        classSession: {
          startTime: { gte: new Date() },
        },
      },
      include: {
        classSession: {
          include: {
            classType: {
              select: { id: true, name: true, color: true },
            },
            location: {
              select: { id: true, name: true },
            },
            instructor: {
              select: { displayName: true },
            },
          },
        },
      },
      orderBy: { classSession: { startTime: 'asc' } },
    }) as Promise<BookingWithDetails[]>;
  }

  /**
   * Get booking history for a member
   */
  async getHistory(
    memberId: string,
    page = 1,
    perPage = 20
  ): Promise<{ bookings: BookingWithDetails[]; total: number }> {
    const where = {
      memberId,
      classSession: {
        startTime: { lt: new Date() },
      },
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          classSession: {
            include: {
              classType: {
                select: { id: true, name: true, color: true },
              },
              location: {
                select: { id: true, name: true },
              },
              instructor: {
                select: { displayName: true },
              },
            },
          },
        },
        orderBy: { classSession: { startTime: 'desc' } },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings: bookings as BookingWithDetails[], total };
  }

  /**
   * Promote first person from waitlist to booked
   */
  private async promoteFromWaitlist(classSessionId: string): Promise<void> {
    const nextInLine = await prisma.booking.findFirst({
      where: {
        classSessionId,
        status: BookingStatus.WAITLISTED,
      },
      orderBy: { waitlistPosition: 'asc' },
      include: {
        member: true,
      },
    });

    if (!nextInLine) return;

    // Check if they have a valid membership
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
    });

    if (!classSession) return;

    const membershipCheck = await memberMembershipService.canBookClass(
      nextInLine.memberId,
      classSession.classTypeId,
      classSession.locationId
    );

    if (!membershipCheck.canBook) {
      // Skip this person and try next
      await prisma.booking.update({
        where: { id: nextInLine.id },
        data: { status: BookingStatus.CANCELLED },
      });
      await this.reorderWaitlist(classSessionId);
      await this.promoteFromWaitlist(classSessionId);
      return;
    }

    // Promote to booked
    await prisma.booking.update({
      where: { id: nextInLine.id },
      data: {
        status: BookingStatus.BOOKED,
        waitlistPosition: null,
        promotedFromWaitlistAt: new Date(),
        creditDeducted: membershipCheck.membership?.membershipType.type === MembershipKind.CLASS_PACK,
        memberMembershipId: membershipCheck.membership?.id,
      },
    });

    await prisma.classSession.update({
      where: { id: classSessionId },
      data: {
        spotsBooked: { increment: 1 },
        waitlistCount: { decrement: 1 },
      },
    });

    // Deduct credit if class pack
    if (membershipCheck.membership?.membershipType.type === MembershipKind.CLASS_PACK) {
      await memberMembershipService.useCredit(nextInLine.memberId, classSessionId);
    }

    // Reorder remaining waitlist
    await this.reorderWaitlist(classSessionId);

    // TODO: Send notification to promoted member
  }

  /**
   * Reorder waitlist positions after a change
   */
  private async reorderWaitlist(classSessionId: string): Promise<void> {
    const waitlistBookings = await prisma.booking.findMany({
      where: {
        classSessionId,
        status: BookingStatus.WAITLISTED,
      },
      orderBy: { waitlistPosition: 'asc' },
    });

    for (let i = 0; i < waitlistBookings.length; i++) {
      if (waitlistBookings[i].waitlistPosition !== i + 1) {
        await prisma.booking.update({
          where: { id: waitlistBookings[i].id },
          data: { waitlistPosition: i + 1 },
        });
      }
    }
  }
}

export const bookingService = new BookingService();
