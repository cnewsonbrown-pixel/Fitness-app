import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBookingSchema, checkInByQRSchema } from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/v1/bookings/upcoming
 * @desc    Get member's upcoming bookings
 * @access  Private (Members)
 */
router.get('/upcoming', bookingController.getUpcoming);

/**
 * @route   GET /api/v1/bookings/history
 * @desc    Get member's booking history
 * @access  Private (Members)
 */
router.get('/history', bookingController.getHistory);

/**
 * @route   POST /api/v1/bookings
 * @desc    Book a class
 * @access  Private (Members or Staff)
 */
router.post(
  '/',
  validate(createBookingSchema),
  bookingController.book
);

/**
 * @route   POST /api/v1/bookings/check-in/qr
 * @desc    Check in via QR code scan
 * @access  Private (Staff only)
 */
router.post(
  '/check-in/qr',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.INSTRUCTOR, StaffRole.FRONT_DESK]),
  validate(checkInByQRSchema),
  bookingController.checkInByQR
);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking details
 * @access  Private (Owner or Staff)
 */
router.get('/:id', bookingController.getById);

/**
 * @route   DELETE /api/v1/bookings/:id
 * @desc    Cancel a booking
 * @access  Private (Owner or Staff)
 */
router.delete('/:id', bookingController.cancel);

/**
 * @route   POST /api/v1/bookings/:id/check-in
 * @desc    Manually check in a member
 * @access  Private (Staff only)
 */
router.post(
  '/:id/check-in',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.INSTRUCTOR, StaffRole.FRONT_DESK]),
  bookingController.checkIn
);

export default router;
