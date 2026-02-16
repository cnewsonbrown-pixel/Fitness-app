import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as controller from '../controllers/custom-analytics.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

router.use(authenticate);
router.use(requireTenant);
router.use(requireStaff(managerRoles));

// Dashboards
router.get('/dashboards', controller.getDashboards);
router.post('/dashboards', controller.saveDashboard);

// Widget data
router.post('/widgets/resolve', controller.resolveWidget);

// Reports
router.post('/reports/generate', controller.generateReport);

export default router;
