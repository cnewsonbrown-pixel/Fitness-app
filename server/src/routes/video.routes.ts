import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as videoController from '../controllers/video.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

router.use(authenticate);
router.use(requireTenant);

// Public (authenticated member) endpoints
router.get('/programs', videoController.listPrograms);
router.get('/programs/:id', videoController.getProgram);
router.get('/videos', videoController.listVideos);
router.get('/videos/:id', videoController.getVideo);

// Progress tracking (member)
router.post('/videos/:videoId/progress', videoController.updateProgress);
router.get('/progress', videoController.getMemberProgress);

// Admin endpoints
router.post('/programs', requireStaff(managerRoles), videoController.createProgram);
router.put('/programs/:id', requireStaff(managerRoles), videoController.updateProgram);
router.delete('/programs/:id', requireStaff(managerRoles), videoController.deleteProgram);

router.post('/videos', requireStaff(managerRoles), videoController.createVideo);
router.put('/videos/:id', requireStaff(managerRoles), videoController.updateVideo);
router.delete('/videos/:id', requireStaff(managerRoles), videoController.deleteVideo);

// Analytics (admin)
router.get('/videos/:id/analytics', requireStaff(managerRoles), videoController.getVideoAnalytics);
router.get('/analytics', requireStaff(managerRoles), videoController.getLibraryAnalytics);

export default router;
