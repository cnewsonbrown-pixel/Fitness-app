import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as staffController from '../controllers/staff.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createStaffSchema,
  updateStaffSchema,
  createAvailabilitySchema,
  createOverrideSchema,
  createCertificationSchema,
  updateCertificationSchema,
} from '../utils/validators.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

const adminOnly = requireStaff([StaffRole.OWNER, StaffRole.ADMIN]);
const managerUp = requireStaff([StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER]);

// ============================================
// STAFF CRUD
// ============================================

/** GET /api/v1/staff - List staff members */
router.get('/', managerUp, staffController.list);

/** GET /api/v1/staff/stats - Staff statistics */
router.get('/stats', adminOnly, staffController.getStats);

/** GET /api/v1/staff/instructors - List instructors */
router.get('/instructors', staffController.listInstructors);

/** GET /api/v1/staff/certifications/expiring - Expiring certifications */
router.get('/certifications/expiring', managerUp, staffController.getExpiringCertifications);

/** POST /api/v1/staff - Create staff member */
router.post('/', adminOnly, validate(createStaffSchema), staffController.create);

/** GET /api/v1/staff/:id - Get staff member */
router.get('/:id', managerUp, staffController.getById);

/** PATCH /api/v1/staff/:id - Update staff member */
router.patch('/:id', adminOnly, validate(updateStaffSchema), staffController.update);

/** DELETE /api/v1/staff/:id - Deactivate staff member */
router.delete('/:id', adminOnly, staffController.deactivate);

// ============================================
// INSTRUCTOR AVAILABILITY
// ============================================

/** GET /api/v1/staff/:id/availability - Get availability */
router.get('/:id/availability', staffController.getAvailability);

/** POST /api/v1/staff/:id/availability - Set availability slot */
router.post('/:id/availability', managerUp, validate(createAvailabilitySchema), staffController.setAvailability);

/** DELETE /api/v1/staff/:id/availability/:slotId - Remove availability slot */
router.delete('/:id/availability/:slotId', managerUp, staffController.removeAvailability);

/** GET /api/v1/staff/:id/overrides - Get date overrides */
router.get('/:id/overrides', staffController.getOverrides);

/** POST /api/v1/staff/:id/overrides - Set date override */
router.post('/:id/overrides', managerUp, validate(createOverrideSchema), staffController.setOverride);

// ============================================
// CERTIFICATIONS
// ============================================

/** GET /api/v1/staff/:id/certifications - Get certifications */
router.get('/:id/certifications', staffController.getCertifications);

/** POST /api/v1/staff/:id/certifications - Add certification */
router.post('/:id/certifications', managerUp, validate(createCertificationSchema), staffController.addCertification);

/** PATCH /api/v1/staff/:id/certifications/:certId - Update certification */
router.patch('/:id/certifications/:certId', managerUp, validate(updateCertificationSchema), staffController.updateCertification);

/** DELETE /api/v1/staff/:id/certifications/:certId - Remove certification */
router.delete('/:id/certifications/:certId', managerUp, staffController.removeCertification);

// ============================================
// COMPENSATION & SCHEDULE
// ============================================

/** GET /api/v1/staff/:id/schedule - Get teaching schedule */
router.get('/:id/schedule', staffController.getSchedule);

/** GET /api/v1/staff/:id/pay-summary - Get pay summary */
router.get('/:id/pay-summary', managerUp, staffController.getPaySummary);

/** GET /api/v1/staff/:id/metrics - Get performance metrics */
router.get('/:id/metrics', managerUp, staffController.getMetrics);

export default router;
