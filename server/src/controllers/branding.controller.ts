import { Request, Response, NextFunction } from 'express';
import { brandingService } from '../services/branding.service.js';

export const getBranding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await brandingService.getBranding(req.tenantId!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateBranding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await brandingService.updateBranding(req.tenantId!, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getPresets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = brandingService.getPresets();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const applyPreset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await brandingService.applyPreset(req.tenantId!, req.params.presetId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getCss = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const css = await brandingService.getFullCss(req.tenantId!);
    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    next(error);
  }
};

export const getAppBuildConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await brandingService.generateAppBuildConfig(req.tenantId!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
