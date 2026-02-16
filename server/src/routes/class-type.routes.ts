import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as classTypeController from '../controllers/class-type.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createClassTypeSchema, updateClassTypeSchema } from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/v1/class-types
 * @desc    List all class types
 * @access  Private
 */
router.get('/', classTypeController.list);

/**
 * @route   GET /api/v1/class-types/:id
 * @desc    Get class type details
 * @access  Private
 */
router.get('/:id', classTypeController.getById);

/**
 * @route   POST /api/v1/class-types
 * @desc    Create a new class type
 * @access  Private (Staff only)
 */
router.post(
  '/',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(createClassTypeSchema),
  classTypeController.create
);

/**
 * @route   PUT /api/v1/class-types/:id
 * @desc    Update a class type
 * @access  Private (Staff only)
 */
router.put(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(updateClassTypeSchema),
  classTypeController.update
);

/**
 * @route   DELETE /api/v1/class-types/:id
 * @desc    Deactivate a class type
 * @access  Private (Staff only)
 */
router.delete(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN]),
  classTypeController.deactivate
);

/**
 * @route   GET /api/v1/class-types/:id/stats
 * @desc    Get class type statistics
 * @access  Private (Staff only)
 */
router.get(
  '/:id/stats',
  requireStaff(),
  classTypeController.getStats
);

export default router;
