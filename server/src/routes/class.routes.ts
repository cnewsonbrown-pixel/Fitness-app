import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as classController from '../controllers/class.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createClassSessionSchema, updateClassSessionSchema } from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/v1/classes
 * @desc    List class sessions with filters
 * @access  Private
 */
router.get('/', classController.list);

/**
 * @route   GET /api/v1/classes/schedule
 * @desc    Get weekly schedule
 * @access  Private
 */
router.get('/schedule', classController.getSchedule);

/**
 * @route   GET /api/v1/classes/:id
 * @desc    Get class session details
 * @access  Private
 */
router.get('/:id', classController.getById);

/**
 * @route   POST /api/v1/classes
 * @desc    Create a new class session
 * @access  Private (Staff only)
 */
router.post(
  '/',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(createClassSessionSchema),
  classController.create
);

/**
 * @route   PUT /api/v1/classes/:id
 * @desc    Update a class session
 * @access  Private (Staff only)
 */
router.put(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(updateClassSessionSchema),
  classController.update
);

/**
 * @route   DELETE /api/v1/classes/:id
 * @desc    Cancel a class session
 * @access  Private (Staff only)
 */
router.delete(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  classController.cancel
);

/**
 * @route   GET /api/v1/classes/:id/roster
 * @desc    Get class roster
 * @access  Private (Staff only)
 */
router.get(
  '/:id/roster',
  requireStaff(),
  classController.getRoster
);

/**
 * @route   GET /api/v1/classes/:id/waitlist
 * @desc    Get class waitlist
 * @access  Private (Staff only)
 */
router.get(
  '/:id/waitlist',
  requireStaff(),
  classController.getWaitlist
);

/**
 * @route   POST /api/v1/classes/:id/start
 * @desc    Mark class as in progress
 * @access  Private (Staff only)
 */
router.post(
  '/:id/start',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.INSTRUCTOR]),
  classController.startClass
);

/**
 * @route   POST /api/v1/classes/:id/complete
 * @desc    Mark class as completed
 * @access  Private (Staff only)
 */
router.post(
  '/:id/complete',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.INSTRUCTOR]),
  classController.completeClass
);

export default router;
