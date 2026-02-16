import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/api-key.service.js';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await apiKeyService.create({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        name: result.name,
        key: result.rawKey, // Only shown once
        keyPrefix: result.keyPrefix,
        scopes: result.scopes,
        rateLimit: result.rateLimit,
      },
    });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await apiKeyService.list(req.tenantId!);
    res.json({ success: true, data: keys });
  } catch (error) { next(error); }
};

export const revoke = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await apiKeyService.revoke(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'API key revoked' });
  } catch (error) { next(error); }
};

export const rotate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await apiKeyService.rotate(req.params.id, req.tenantId!);
    res.json({
      success: true,
      data: {
        id: result.id,
        name: result.name,
        key: result.rawKey,
        keyPrefix: result.keyPrefix,
      },
    });
  } catch (error) { next(error); }
};
