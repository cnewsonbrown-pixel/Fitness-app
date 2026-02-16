import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, requireStaff } from '../middleware/auth.middleware.js';
import { createTenantSchema } from '../utils/validators.js';
import { StaffRole } from '@prisma/client';

const router = Router();

/**
 * @route   POST /api/v1/tenants
 * @desc    Create a new tenant (studio)
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createTenantSchema),
  tenantController.create
);

/**
 * @route   GET /api/v1/tenants/check-slug/:slug
 * @desc    Check if a slug is available
 * @access  Public
 */
router.get(
  '/check-slug/:slug',
  tenantController.checkSlug
);

/**
 * @route   GET /api/v1/tenants/current
 * @desc    Get current tenant details
 * @access  Private
 */
router.get(
  '/current',
  authenticate,
  tenantController.getCurrent
);

/**
 * @route   PATCH /api/v1/tenants/current
 * @desc    Update current tenant settings
 * @access  Private (Owner/Admin only)
 */
router.patch(
  '/current',
  authenticate,
  requireStaff([StaffRole.OWNER, StaffRole.ADMIN]),
  tenantController.updateCurrent
);

/**
 * @route   GET /api/v1/tenants/current/stats
 * @desc    Get current tenant statistics
 * @access  Private (Staff only)
 */
router.get(
  '/current/stats',
  authenticate,
  requireStaff(),
  tenantController.getStats
);

/**
 * @route   GET /api/v1/tenants/:slug
 * @desc    Get tenant public info by slug
 * @access  Public
 */
router.get(
  '/:slug',
  tenantController.getBySlug
);

export default router;
