import { Request, Response, NextFunction } from 'express';
import { journeyService } from '../services/journey.service.js';
import { segmentService } from '../services/segment.service.js';
import { leadScoringService } from '../services/lead-scoring.service.js';
import { campaignTemplateService } from '../services/campaign-template.service.js';

// ===== JOURNEYS =====

export const createJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeyService.create({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: journey });
  } catch (error) { next(error); }
};

export const getJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeyService.getById(req.params.id, req.tenantId!);
    if (!journey) return res.status(404).json({ success: false, error: 'Journey not found' });
    res.json({ success: true, data: journey });
  } catch (error) { next(error); }
};

export const listJourneys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journeys = await journeyService.list(req.tenantId!);
    res.json({ success: true, data: journeys });
  } catch (error) { next(error); }
};

export const updateJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeyService.update(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: journey });
  } catch (error) { next(error); }
};

export const activateJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeyService.activate(req.params.id, req.tenantId!);
    res.json({ success: true, data: journey });
  } catch (error) { next(error); }
};

export const deactivateJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeyService.deactivate(req.params.id, req.tenantId!);
    res.json({ success: true, data: journey });
  } catch (error) { next(error); }
};

export const deleteJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await journeyService.delete(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Journey deleted' });
  } catch (error) { next(error); }
};

// Journey Steps
export const addJourneyStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const step = await journeyService.addStep({ journeyId: req.params.id, ...req.body });
    res.status(201).json({ success: true, data: step });
  } catch (error) { next(error); }
};

export const updateJourneyStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const step = await journeyService.updateStep(req.params.stepId, req.params.id, req.body);
    res.json({ success: true, data: step });
  } catch (error) { next(error); }
};

export const removeJourneyStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await journeyService.removeStep(req.params.stepId, req.params.id);
    res.json({ success: true, message: 'Step removed' });
  } catch (error) { next(error); }
};

export const reorderJourneySteps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await journeyService.reorderSteps(req.params.id, req.body.stepIds);
    res.json({ success: true, message: 'Steps reordered' });
  } catch (error) { next(error); }
};

// Enrollment
export const enrollMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollment = await journeyService.enrollMember(req.params.id, req.body.memberId);
    res.json({ success: true, data: enrollment });
  } catch (error) { next(error); }
};

export const processJourneySteps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await journeyService.processDueSteps();
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ===== SEGMENTS =====

export const createSegment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentService.create({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: segment });
  } catch (error) { next(error); }
};

export const getSegment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentService.getById(req.params.id, req.tenantId!);
    if (!segment) return res.status(404).json({ success: false, error: 'Segment not found' });
    res.json({ success: true, data: segment });
  } catch (error) { next(error); }
};

export const listSegments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segments = await segmentService.list(req.tenantId!);
    res.json({ success: true, data: segments });
  } catch (error) { next(error); }
};

export const updateSegment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentService.update(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: segment });
  } catch (error) { next(error); }
};

export const deleteSegment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await segmentService.delete(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Segment deleted' });
  } catch (error) { next(error); }
};

export const getSegmentMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await segmentService.getMembers(req.params.id, req.tenantId!);
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
};

export const refreshSegments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await segmentService.refreshAll(req.tenantId!);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ===== LEAD SCORING =====

export const createScoringRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await leadScoringService.createRule({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: rule });
  } catch (error) { next(error); }
};

export const listScoringRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await leadScoringService.listRules(req.tenantId!);
    res.json({ success: true, data: rules });
  } catch (error) { next(error); }
};

export const updateScoringRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await leadScoringService.updateRule(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: rule });
  } catch (error) { next(error); }
};

export const deleteScoringRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await leadScoringService.deleteRule(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) { next(error); }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const members = await leadScoringService.getLeaderboard(req.tenantId!, limit);
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
};

export const recalculateScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await leadScoringService.recalculateScore(req.params.memberId, req.tenantId!);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ===== CAMPAIGN TEMPLATES =====

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await campaignTemplateService.create({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const listTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await campaignTemplateService.list(req.tenantId!, req.query.category as any);
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await campaignTemplateService.update(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await campaignTemplateService.delete(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) { next(error); }
};
