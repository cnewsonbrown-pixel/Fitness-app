import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as gamificationController from '../controllers/gamification.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

router.use(authenticate);
router.use(requireTenant);

// Points
router.get('/points/leaderboard', gamificationController.getPointsLeaderboard);
router.get('/points/:memberId/history', gamificationController.getPointsHistory);
router.post('/points/award', requireStaff(managerRoles), gamificationController.awardPoints);

// Badges
router.get('/badges', gamificationController.listBadges);
router.post('/badges', requireStaff(managerRoles), gamificationController.createBadge);
router.post('/badges/:badgeId/award', requireStaff(managerRoles), gamificationController.awardBadge);
router.get('/badges/member/:memberId', gamificationController.getMemberBadges);

// Challenges
router.get('/challenges', gamificationController.listChallenges);
router.post('/challenges', requireStaff(managerRoles), gamificationController.createChallenge);
router.post('/challenges/:id/join', gamificationController.joinChallenge);
router.post('/challenges/:id/progress', requireStaff(managerRoles), gamificationController.updateProgress);
router.get('/challenges/:id/leaderboard', gamificationController.getChallengeLeaderboard);

// Streaks
router.get('/streaks/leaderboard', gamificationController.getStreakLeaderboard);

export default router;
