import { Request, Response, NextFunction } from 'express';
import { gamificationService } from '../services/gamification.service.js';

// Points
export const awardPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tx = await gamificationService.awardPoints(req.body);
    res.json({ success: true, data: tx });
  } catch (error) { next(error); }
};

export const getPointsHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await gamificationService.getPointsHistory(req.params.memberId);
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
};

export const getPointsLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await gamificationService.getPointsLeaderboard(req.tenantId!, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
};

// Badges
export const createBadge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const badge = await gamificationService.createBadge({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: badge });
  } catch (error) { next(error); }
};

export const listBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const badges = await gamificationService.listBadges(req.tenantId!);
    res.json({ success: true, data: badges });
  } catch (error) { next(error); }
};

export const awardBadge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await gamificationService.awardBadge(req.body.memberId, req.params.badgeId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getMemberBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const badges = await gamificationService.getMemberBadges(req.params.memberId);
    res.json({ success: true, data: badges });
  } catch (error) { next(error); }
};

// Challenges
export const createChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const challenge = await gamificationService.createChallenge({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: challenge });
  } catch (error) { next(error); }
};

export const listChallenges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active === 'true';
    const challenges = await gamificationService.listChallenges(req.tenantId!, activeOnly);
    res.json({ success: true, data: challenges });
  } catch (error) { next(error); }
};

export const joinChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await gamificationService.joinChallenge(req.params.id, req.body.memberId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await gamificationService.updateProgress(req.params.id, req.body.memberId, req.body.progress);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getChallengeLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await gamificationService.getChallengeLeaderboard(req.params.id);
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
};

// Streaks
export const getStreakLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await gamificationService.getStreakLeaderboard(req.tenantId!, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
};
