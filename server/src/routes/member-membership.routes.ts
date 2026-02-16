import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as membershipController from '../controllers/membership.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createMemberMembershipSchema, cancelMembershipSchema } from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/v1/memberships
 * @desc    Get current member's memberships
 * @access  Private
 */
router.get(
  '/',
  membershipController.getMyMemberships
);

/**
 * @route   GET /api/v1/memberships/check-booking
 * @desc    Check if member can book a class
 * @access  Private
 */
router.get(
  '/check-booking',
  membershipController.checkBookingEligibility
);

/**
 * @route   POST /api/v1/memberships
 * @desc    Purchase/assign a membership
 * @access  Private (Members for self, Staff for any member)
 */
router.post(
  '/',
  validate(createMemberMembershipSchema),
  membershipController.createMembership
);

/**
 * @route   GET /api/v1/memberships/:id
 * @desc    Get membership details
 * @access  Private (Own or Staff)
 */
router.get(
  '/:id',
  membershipController.getMembership
);

/**
 * @route   POST /api/v1/memberships/:id/pause
 * @desc    Pause a membership
 * @access  Private (Own or Staff)
 */
router.post(
  '/:id/pause',
  membershipController.pauseMembership
);

/**
 * @route   POST /api/v1/memberships/:id/resume
 * @desc    Resume a paused membership
 * @access  Private (Own or Staff)
 */
router.post(
  '/:id/resume',
  membershipController.resumeMembership
);

/**
 * @route   POST /api/v1/memberships/:id/cancel
 * @desc    Cancel a membership
 * @access  Private (Own or Staff)
 */
router.post(
  '/:id/cancel',
  validate(cancelMembershipSchema),
  membershipController.cancelMembership
);

export default router;
