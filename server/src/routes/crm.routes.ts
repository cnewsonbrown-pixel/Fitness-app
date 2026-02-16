import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as crmController from '../controllers/crm.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];
const adminRoles = [StaffRole.OWNER, StaffRole.ADMIN];

router.use(authenticate);
router.use(requireTenant);
router.use(requireStaff(managerRoles));

// ===== JOURNEYS =====

router.get('/journeys', crmController.listJourneys);
router.post('/journeys', crmController.createJourney);
router.get('/journeys/:id', crmController.getJourney);
router.patch('/journeys/:id', crmController.updateJourney);
router.delete('/journeys/:id', crmController.deleteJourney);
router.post('/journeys/:id/activate', crmController.activateJourney);
router.post('/journeys/:id/deactivate', crmController.deactivateJourney);
router.post('/journeys/:id/enroll', crmController.enrollMember);

// Journey Steps
router.post('/journeys/:id/steps', crmController.addJourneyStep);
router.patch('/journeys/:id/steps/:stepId', crmController.updateJourneyStep);
router.delete('/journeys/:id/steps/:stepId', crmController.removeJourneyStep);
router.post('/journeys/:id/steps/reorder', crmController.reorderJourneySteps);

// Journey Processing (admin/cron)
router.post('/journeys/process', requireStaff(adminRoles), crmController.processJourneySteps);

// ===== SEGMENTS =====

router.get('/segments', crmController.listSegments);
router.post('/segments', crmController.createSegment);
router.get('/segments/:id', crmController.getSegment);
router.patch('/segments/:id', crmController.updateSegment);
router.delete('/segments/:id', crmController.deleteSegment);
router.get('/segments/:id/members', crmController.getSegmentMembers);
router.post('/segments/refresh', crmController.refreshSegments);

// ===== LEAD SCORING =====

router.get('/scoring/rules', crmController.listScoringRules);
router.post('/scoring/rules', crmController.createScoringRule);
router.patch('/scoring/rules/:id', crmController.updateScoringRule);
router.delete('/scoring/rules/:id', crmController.deleteScoringRule);
router.get('/scoring/leaderboard', crmController.getLeaderboard);
router.post('/scoring/recalculate/:memberId', crmController.recalculateScore);

// ===== CAMPAIGN TEMPLATES =====

router.get('/templates', crmController.listTemplates);
router.post('/templates', crmController.createTemplate);
router.patch('/templates/:id', crmController.updateTemplate);
router.delete('/templates/:id', crmController.deleteTemplate);

export default router;
