import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * POST /bookings
 * Book a class
 */
export const book = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { classSessionId, memberId } = req.body;

    // If staff is booking for a member, use provided memberId
    // Otherwise, use current member's ID
    let targetMemberId = memberId;

    if (!req.user?.staff) {
      if (!req.user?.member) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Member profile required' },
        });
        return;
      }
      targetMemberId = req.user.member.id;
    }

    const booking = await bookingService.book({
      memberId: targetMemberId,
      classSessionId,
    });

    res.status(201).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /bookings/:id
 * Cancel a booking
 */
export const cancel = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get booking to check ownership
    const existing = await bookingService.getById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' },
      });
      return;
    }

    // Staff can cancel any booking, members can only cancel their own
    const targetMemberId = req.user?.staff ? existing.memberId : req.user?.member?.id;
    if (!targetMemberId || existing.memberId !== targetMemberId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    const booking = await bookingService.cancel(id, existing.memberId);

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /bookings/:id/check-in
 * Check in to a class
 */
export const checkIn = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Only staff can manually check in
    if (!req.user?.staff) {
      throw new ForbiddenError('Only staff can check in members');
    }

    const booking = await bookingService.checkIn(id, 'MANUAL');

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /bookings/check-in/qr
 * Check in via QR code scan
 */
export const checkInByQR = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId, classSessionId } = req.body;

    // Only staff can scan QR codes
    if (!req.user?.staff) {
      throw new ForbiddenError('Only staff can scan QR codes');
    }

    const booking = await bookingService.checkInByQR(memberId, classSessionId);

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/upcoming
 * Get member's upcoming bookings
 */
export const getUpcoming = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.member) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Member profile required' },
      });
      return;
    }

    const bookings = await bookingService.getUpcoming(req.user.member.id);

    res.json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/history
 * Get member's booking history
 */
export const getHistory = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.member) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Member profile required' },
      });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string, 10) : 20;

    const result = await bookingService.getHistory(req.user.member.id, page, perPage);

    res.json({
      success: true,
      data: { bookings: result.bookings },
      meta: {
        page,
        perPage,
        total: result.total,
        totalPages: Math.ceil(result.total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/:id
 * Get booking details
 */
export const getById = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getById(id);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' },
      });
      return;
    }

    // Members can only view their own bookings
    if (!req.user?.staff && req.user?.member?.id !== booking.memberId) {
      throw new ForbiddenError('You can only view your own bookings');
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
