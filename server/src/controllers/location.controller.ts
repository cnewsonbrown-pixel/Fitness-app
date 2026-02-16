import { Response, NextFunction } from 'express';
import { locationService } from '../services/location.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

/**
 * GET /locations
 * List all locations
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
    const locations = await locationService.list(req.tenantId, includeInactive);

    res.json({
      success: true,
      data: { locations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /locations/:id
 * Get location details
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
    const location = await locationService.getById(id, req.tenantId);

    if (!location) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /locations
 * Create a new location
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

    const location = await locationService.create({
      tenantId: req.tenantId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /locations/:id
 * Update a location
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
    const location = await locationService.update(id, req.tenantId, req.body);

    res.json({
      success: true,
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /locations/:id
 * Deactivate a location
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
    await locationService.deactivate(id, req.tenantId);

    res.json({
      success: true,
      data: { message: 'Location deactivated' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /locations/:id/stats
 * Get location statistics
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
    const stats = await locationService.getStats(id, req.tenantId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
