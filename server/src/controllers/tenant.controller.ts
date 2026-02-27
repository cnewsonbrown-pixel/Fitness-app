import { Request, Response, NextFunction } from 'express';
import { StaffRole } from '@prisma/client';
import { tenantService } from '../services/tenant.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { CreateTenantInput } from '../utils/validators.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * POST /tenants
 * Create a new tenant (studio)
 */
export const create = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    // User shouldn't already belong to a tenant
    if (req.user.tenantId) {
      throw new ForbiddenError('You already belong to a studio');
    }

    const { name, slug, tier, timezone, currency } = req.body as CreateTenantInput;

    const tenant = await tenantService.create({
      name,
      slug,
      ownerId: req.user.id,
      tier,
      timezone,
      currency,
    });

    res.status(201).json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tenants/check-slug/:slug
 * Check if a slug is available
 */
export const checkSlug = async (
  req: Request<{ slug: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const available = await tenantService.isSlugAvailable(slug);

    res.json({
      success: true,
      data: { available },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tenants/current
 * Get current tenant details
 */
export const getCurrent = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No studio associated with your account' },
      });
      return;
    }

    const tenant = await tenantService.getById(req.tenantId);

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Studio not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /tenants/current
 * Update current tenant settings
 */
export const updateCurrent = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No studio associated with your account' },
      });
      return;
    }

    // Check if user is owner or admin
    const allowedRoles: StaffRole[] = [StaffRole.OWNER, StaffRole.ADMIN];
    if (!req.user?.staff || !allowedRoles.includes(req.user.staff.role)) {
      throw new ForbiddenError('Only owners and admins can update studio settings');
    }

    const tenant = await tenantService.update(req.tenantId, req.body);

    res.json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tenants/current/stats
 * Get current tenant statistics
 */
export const getStats = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No studio associated with your account' },
      });
      return;
    }

    const stats = await tenantService.getStats(req.tenantId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tenants/:slug
 * Get tenant public info by slug (for member signup)
 */
export const getBySlug = async (
  req: Request<{ slug: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = await tenantService.getBySlug(req.params.slug);

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Studio not found' },
      });
      return;
    }

    // Return only public info
    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
