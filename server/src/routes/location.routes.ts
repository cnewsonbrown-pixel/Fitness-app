import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as locationController from '../controllers/location.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createLocationSchema, updateLocationSchema } from '../utils/validators.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/v1/locations
 * @desc    List all locations
 * @access  Private
 */
router.get('/', locationController.list);

/**
 * @route   GET /api/v1/locations/:id
 * @desc    Get location details
 * @access  Private
 */
router.get('/:id', locationController.getById);

/**
 * @route   POST /api/v1/locations
 * @desc    Create a new location
 * @access  Private (Staff only)
 */
router.post(
  '/',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN]),
  validate(createLocationSchema),
  locationController.create
);

/**
 * @route   PUT /api/v1/locations/:id
 * @desc    Update a location
 * @access  Private (Staff only)
 */
router.put(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]),
  validate(updateLocationSchema),
  locationController.update
);

/**
 * @route   DELETE /api/v1/locations/:id
 * @desc    Deactivate a location
 * @access  Private (Staff only)
 */
router.delete(
  '/:id',
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN]),
  locationController.deactivate
);

/**
 * @route   GET /api/v1/locations/:id/stats
 * @desc    Get location statistics
 * @access  Private (Staff only)
 */
router.get(
  '/:id/stats',
  requireStaff(),
  locationController.getStats
);

export default router;
