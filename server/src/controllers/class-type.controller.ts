import { Response, NextFunction } from 'express';
import { classTypeService } from '../services/class-type.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

/**
 * GET /class-types
 * List all class types
 */
export const list = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const includeInactive = req.query.includeInactive === 'true' && !!req.user?.staff;
    const classTypes = await classTypeService.list(req.tenantId, includeInactive);

    res.json({
      success: true,
      data: { classTypes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /class-types/:id
 * Get class type details
 */
export const getById = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const classType = await classTypeService.getById(id, req.tenantId);

    if (!classType) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Class type not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { classType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /class-types
 * Create a new class type
 */
export const create = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const classType = await classTypeService.create({
      tenantId: req.tenantId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: { classType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /class-types/:id
 * Update a class type
 */
export const update = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const classType = await classTypeService.update(id, req.tenantId, req.body);

    res.json({
      success: true,
      data: { classType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /class-types/:id
 * Deactivate a class type
 */
export const deactivate = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    await classTypeService.deactivate(id, req.tenantId);

    res.json({
      success: true,
      data: { message: 'Class type deactivated' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /class-types/:id/stats
 * Get class type statistics
 */
export const getStats = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const stats = await classTypeService.getStats(id, req.tenantId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
