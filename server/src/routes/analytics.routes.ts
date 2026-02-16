import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

router.use(authenticate);
router.use(requireTenant);
router.use(requireStaff(managerRoles));

// Dashboard
router.get('/dashboard', analyticsController.getDashboard);
router.get('/popular-times', analyticsController.getPopularTimes);
router.get('/retention', analyticsController.getRetention);

// Reports
router.get('/reports/member-activity', analyticsController.getMemberActivityReport);
router.get('/reports/revenue', analyticsController.getRevenueReport);
router.get('/reports/attendance', analyticsController.getAttendanceReport);
router.get('/reports/instructor-pay', analyticsController.getInstructorPayReport);

export default router;
