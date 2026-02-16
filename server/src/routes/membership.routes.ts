import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as membershipController from '../controllers/membership.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createMembershipTypeSchema,
  updateMembershipTypeSchema,
  createMemberMembershipSchema,
  cancelMembershipSchema,
} from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

// ============================================
// MEMBERSHIP TYPES
// ============================================

/**
 * @route   GET /api/v1/membership-types
 * @desc    List membership types
 * @access  Private (Public types for members, all for staff)
 */
router.get(
  '/',
  membershipController.listMembershipTypes
);

/**
 * @route   GET /api/v1/membership-types/:id
 * @desc    Get membership type details
 * @access  Private
 */
router.get(
  '/:id',
  membershipController.getMembershipType
);

/**
 * @route   POST /api/v1/membership-types
 * @desc    Create membership type
 * @access  Private (Staff only)
 */
router.post(
  '/',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(createMembershipTypeSchema),
  membershipController.createMembershipType
);

/**
 * @route   PUT /api/v1/membership-types/:id
 * @desc    Update membership type
 * @access  Private (Staff only)
 */
router.put(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(updateMembershipTypeSchema),
  membershipController.updateMembershipType
);

/**
 * @route   DELETE /api/v1/membership-types/:id
 * @desc    Deactivate membership type
 * @access  Private (Staff only)
 */
router.delete(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN]),
  membershipController.deleteMembershipType
);

/**
 * @route   GET /api/v1/membership-types/:id/stats
 * @desc    Get membership type statistics
 * @access  Private (Staff only)
 */
router.get(
  '/:id/stats',
  requireStaff(),
  membershipController.getMembershipTypeStats
);

export default router;
