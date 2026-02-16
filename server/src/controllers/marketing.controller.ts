import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaign.service.js';
import { leadService } from '../services/lead.service.js';
import { notificationService } from '../services/notification.service.js';

// ===== CAMPAIGNS =====

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.create({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const getCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getById(req.params.id, req.tenantId!);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const listCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaigns = await campaignService.list(req.tenantId!, req.query.status as any);
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.update(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await campaignService.delete(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
};

export const sendCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await campaignService.send(req.params.id, req.tenantId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ===== LEAD FORMS =====

export const createLeadForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = await leadService.createForm({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

export const getLeadForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = await leadService.getForm(req.params.id, req.tenantId!);
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

export const listLeadForms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forms = await leadService.listForms(req.tenantId!);
    res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
};

export const updateLeadForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = await leadService.updateForm(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await leadService.deleteForm(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Form deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Public endpoint - no auth required
 */
export const submitLeadForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submission = await leadService.submit({
      leadFormId: req.params.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { id: submission.id } });
  } catch (error) {
    next(error);
  }
};

export const listSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await leadService.listSubmissions(req.params.id, req.tenantId!);
    res.json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};

export const convertLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await leadService.convertToMember(req.params.submissionId, req.tenantId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ===== SCHEDULED NOTIFICATIONS =====

export const triggerClassReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.sendClassReminders();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const triggerExpiryWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.sendExpiryWarnings();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
