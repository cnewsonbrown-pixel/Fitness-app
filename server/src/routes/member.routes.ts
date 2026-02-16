import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as memberController from '../controllers/member.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateMemberSchema, addTagsSchema, updateLifecycleStageSchema } from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/v1/members
 * @desc    List members
 * @access  Private (Staff only)
 */
router.get(
  '/',
  requireStaff(),
  memberController.list
);

/**
 * @route   GET /api/v1/members/:id
 * @desc    Get member details
 * @access  Private (Own profile or Staff)
 */
router.get(
  '/:id',
  memberController.getById
);

/**
 * @route   PUT /api/v1/members/:id
 * @desc    Update member profile
 * @access  Private (Own profile or Staff)
 */
router.put(
  '/:id',
  validate(updateMemberSchema),
  memberController.update
);

/**
 * @route   DELETE /api/v1/members/:id
 * @desc    Soft delete member
 * @access  Private (Staff only)
 */
router.delete(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  memberController.remove
);

/**
 * @route   GET /api/v1/members/:id/memberships
 * @desc    Get member's memberships
 * @access  Private (Own profile or Staff)
 */
router.get(
  '/:id/memberships',
  memberController.getMemberships
);

/**
 * @route   GET /api/v1/members/:id/stats
 * @desc    Get member statistics
 * @access  Private (Own profile or Staff)
 */
router.get(
  '/:id/stats',
  memberController.getStats
);

/**
 * @route   POST /api/v1/members/:id/tags
 * @desc    Add tags to member
 * @access  Private (Staff only)
 */
router.post(
  '/:id/tags',
  requireStaff(),
  validate(addTagsSchema),
  memberController.addTags
);

/**
 * @route   DELETE /api/v1/members/:id/tags/:tag
 * @desc    Remove tag from member
 * @access  Private (Staff only)
 */
router.delete(
  '/:id/tags/:tag',
  requireStaff(),
  memberController.removeTag
);

/**
 * @route   PATCH /api/v1/members/:id/lifecycle-stage
 * @desc    Update member lifecycle stage
 * @access  Private (Staff only)
 */
router.patch(
  '/:id/lifecycle-stage',
  requireStaff(),
  validate(updateLifecycleStageSchema),
  memberController.updateLifecycleStage
);

export default router;
