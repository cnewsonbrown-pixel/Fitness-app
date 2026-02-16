import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as marketingController from '../controllers/marketing.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

// ===== CAMPAIGNS =====

router.get('/campaigns', authenticate, requireTenant, requireStaff(managerRoles), marketingController.listCampaigns);
router.post('/campaigns', authenticate, requireTenant, requireStaff(managerRoles), marketingController.createCampaign);
router.get('/campaigns/:id', authenticate, requireTenant, requireStaff(managerRoles), marketingController.getCampaign);
router.patch('/campaigns/:id', authenticate, requireTenant, requireStaff(managerRoles), marketingController.updateCampaign);
router.delete('/campaigns/:id', authenticate, requireTenant, requireStaff(managerRoles), marketingController.deleteCampaign);
router.post('/campaigns/:id/send', authenticate, requireTenant, requireStaff(managerRoles), marketingController.sendCampaign);

// ===== LEAD FORMS =====

router.get('/lead-forms', authenticate, requireTenant, requireStaff(managerRoles), marketingController.listLeadForms);
router.post('/lead-forms', authenticate, requireTenant, requireStaff(managerRoles), marketingController.createLeadForm);
router.get('/lead-forms/:id', authenticate, requireTenant, requireStaff(managerRoles), marketingController.getLeadForm);
router.patch('/lead-forms/:id', authenticate, requireTenant, requireStaff(managerRoles), marketingController.updateLeadForm);
router.delete('/lead-forms/:id', authenticate, requireTenant, requireStaff(managerRoles), marketingController.deleteLeadForm);

// Public endpoint - lead form submission (no auth)
router.post('/lead-forms/:id/submit', marketingController.submitLeadForm);

// Submissions management
router.get('/lead-forms/:id/submissions', authenticate, requireTenant, requireStaff(managerRoles), marketingController.listSubmissions);
router.post('/leads/:submissionId/convert', authenticate, requireTenant, requireStaff(managerRoles), marketingController.convertLead);

// ===== SCHEDULED NOTIFICATION TRIGGERS =====
// These would typically be called by a cron job / scheduled task

router.post('/notifications/class-reminders', authenticate, requireTenant, requireStaff([StaffRole.OWNER, StaffRole.ADMIN]), marketingController.triggerClassReminders);
router.post('/notifications/expiry-warnings', authenticate, requireTenant, requireStaff([StaffRole.OWNER, StaffRole.ADMIN]), marketingController.triggerExpiryWarnings);

export default router;
