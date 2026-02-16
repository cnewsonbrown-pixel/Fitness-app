import { Request, Response, NextFunction } from 'express';
import { LifecycleStage } from '@prisma/client';
import { memberService } from '../services/member.service.js';
import { memberMembershipService } from '../services/member-membership.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * GET /members
 * List members (staff only)
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

    const {
      search,
      lifecycleStage,
      tags,
      hasActiveMembership,
      page,
      perPage,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await memberService.list({
      tenantId: req.tenantId,
      search: search as string,
      lifecycleStage: lifecycleStage as LifecycleStage,
      tags: tags ? (tags as string).split(',') : undefined,
      hasActiveMembership: hasActiveMembership === 'true' ? true : hasActiveMembership === 'false' ? false : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      perPage: perPage ? parseInt(perPage as string, 10) : undefined,
      sortBy: sortBy as 'createdAt' | 'lastName' | 'lastActiveAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: { members: result.members },
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /members/:id
 * Get member details
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

    // Members can only view their own profile unless they're staff
    if (!req.user?.staff && req.user?.member?.id !== id) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const member = await memberService.getById(id, req.tenantId);

    if (!member) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /members/:id
 * Update member profile
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

    // Members can only update their own profile unless they're staff
    if (!req.user?.staff && req.user?.member?.id !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Only staff can update certain fields
    const updateData = { ...req.body };
    if (!req.user?.staff) {
      // Remove staff-only fields
      delete updateData.lifecycleStage;
      delete updateData.leadScore;
      delete updateData.tags;
      delete updateData.customFields;
    }

    const member = await memberService.update(id, req.tenantId, updateData);

    res.json({
      success: true,
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /members/:id
 * Soft delete member (staff only)
 */
export const remove = async (
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

    await memberService.delete(id, req.tenantId);

    res.json({
      success: true,
      data: { message: 'Member deactivated successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /members/:id/memberships
 * Get member's memberships
 */
export const getMemberships = async (
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

    // Members can only view their own memberships unless they're staff
    if (!req.user?.staff && req.user?.member?.id !== id) {
      throw new ForbiddenError('You can only view your own memberships');
    }

    const memberships = await memberMembershipService.listByMember(id);

    res.json({
      success: true,
      data: { memberships },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /members/:id/stats
 * Get member statistics
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

    // Members can only view their own stats unless they're staff
    if (!req.user?.staff && req.user?.member?.id !== id) {
      throw new ForbiddenError('You can only view your own statistics');
    }

    const stats = await memberService.getMemberStats(id, req.tenantId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /members/:id/tags
 * Add tags to member (staff only)
 */
export const addTags = async (
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
    const { tags } = req.body;

    const member = await memberService.addTags(id, req.tenantId, tags);

    res.json({
      success: true,
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /members/:id/tags/:tag
 * Remove tag from member (staff only)
 */
export const removeTag = async (
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

    const { id, tag } = req.params;

    const member = await memberService.removeTag(id, req.tenantId, tag);

    res.json({
      success: true,
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /members/:id/lifecycle-stage
 * Update member lifecycle stage (staff only)
 */
export const updateLifecycleStage = async (
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
    const { stage } = req.body;

    const member = await memberService.updateLifecycleStage(id, req.tenantId, stage);

    res.json({
      success: true,
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};
