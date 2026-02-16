import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as brandingController from '../controllers/branding.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const adminRoles = [StaffRole.OWNER, StaffRole.ADMIN];

router.use(authenticate);
router.use(requireTenant);

// Public (authenticated) - get branding/CSS
router.get('/', brandingController.getBranding);
router.get('/css', brandingController.getCss);
router.get('/presets', brandingController.getPresets);

// Admin only
router.put('/', requireStaff(adminRoles), brandingController.updateBranding);
router.post('/presets/:presetId/apply', requireStaff(adminRoles), brandingController.applyPreset);
router.get('/app-config', requireStaff(adminRoles), brandingController.getAppBuildConfig);

export default router;
