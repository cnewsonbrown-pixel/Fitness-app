import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as apiKeyController from '../controllers/api-key.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const adminRoles = [StaffRole.OWNER, StaffRole.ADMIN];

router.use(authenticate);
router.use(requireTenant);
router.use(requireStaff(adminRoles));

router.get('/', apiKeyController.list);
router.post('/', apiKeyController.create);
router.post('/:id/revoke', apiKeyController.revoke);
router.post('/:id/rotate', apiKeyController.rotate);

export default router;
