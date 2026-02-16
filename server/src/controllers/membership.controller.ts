import { Request, Response, NextFunction } from 'express';
import { MembershipKind } from '@prisma/client';
import { membershipTypeService } from '../services/membership-type.service.js';
import { memberMembershipService } from '../services/member-membership.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { ForbiddenError } from '../utils/errors.js';

// ============================================
// MEMBERSHIP TYPES
// ============================================

/**
 * GET /membership-types
 * List membership types
 */
export const listMembershipTypes = async (
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

    const { type, isActive, isPublic } = req.query;

    // Non-staff can only see public, active membership types
    const filters = {
      tenantId: req.tenantId,
      type: type as MembershipKind,
      isActive: req.user?.staff ? (isActive === 'true' ? true : isActive === 'false' ? false : undefined) : true,
      isPublic: req.user?.staff ? (isPublic === 'true' ? true : isPublic === 'false' ? false : undefined) : true,
    };

    const membershipTypes = await membershipTypeService.list(filters);

    res.json({
      success: true,
      data: { membershipTypes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /membership-types/:id
 * Get membership type details
 */
export const getMembershipType = async (
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
    const membershipType = await membershipTypeService.getById(id, req.tenantId);

    if (!membershipType) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership type not found' },
      });
      return;
    }

    // Non-staff can only see public, active membership types
    if (!req.user?.staff && (!membershipType.isActive || !membershipType.isPublic)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership type not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { membershipType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /membership-types
 * Create membership type (staff only)
 */
export const createMembershipType = async (
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

    const membershipType = await membershipTypeService.create({
      tenantId: req.tenantId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: { membershipType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /membership-types/:id
 * Update membership type (staff only)
 */
export const updateMembershipType = async (
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
    const membershipType = await membershipTypeService.update(id, req.tenantId, req.body);

    res.json({
      success: true,
      data: { membershipType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /membership-types/:id
 * Deactivate membership type (staff only)
 */
export const deleteMembershipType = async (
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
    await membershipTypeService.deactivate(id, req.tenantId);

    res.json({
      success: true,
      data: { message: 'Membership type deactivated' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /membership-types/:id/stats
 * Get membership type statistics (staff only)
 */
export const getMembershipTypeStats = async (
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
    const stats = await membershipTypeService.getStats(id, req.tenantId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MEMBER MEMBERSHIPS
// ============================================

/**
 * GET /memberships
 * Get current member's active memberships
 */
export const getMyMemberships = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.member) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Member profile required' },
      });
      return;
    }

    const memberships = await memberMembershipService.listByMember(req.user.member.id);

    res.json({
      success: true,
      data: { memberships },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /memberships
 * Purchase/assign a membership
 */
export const createMembership = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId, membershipTypeId, startDate } = req.body;

    // If staff is assigning, use provided memberId
    // Otherwise, use current member's ID
    let targetMemberId = memberId;

    if (!req.user?.staff) {
      if (!req.user?.member) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Member profile required' },
        });
        return;
      }
      targetMemberId = req.user.member.id;
    }

    const membership = await memberMembershipService.create({
      memberId: targetMemberId,
      membershipTypeId,
      startDate: startDate ? new Date(startDate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /memberships/:id
 * Get membership details
 */
export const getMembership = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const membership = await memberMembershipService.getById(id);

    if (!membership) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership not found' },
      });
      return;
    }

    // Members can only view their own memberships
    if (!req.user?.staff && req.user?.member?.id !== membership.memberId) {
      throw new ForbiddenError('You can only view your own memberships');
    }

    res.json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /memberships/:id/pause
 * Pause a membership
 */
export const pauseMembership = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get membership to check ownership
    const existing = await memberMembershipService.getById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership not found' },
      });
      return;
    }

    // Members can only pause their own memberships
    const targetMemberId = req.user?.staff ? existing.memberId : req.user?.member?.id;
    if (!targetMemberId || existing.memberId !== targetMemberId) {
      throw new ForbiddenError('You can only pause your own memberships');
    }

    const membership = await memberMembershipService.pause(id, targetMemberId);

    res.json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /memberships/:id/resume
 * Resume a paused membership
 */
export const resumeMembership = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get membership to check ownership
    const existing = await memberMembershipService.getById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership not found' },
      });
      return;
    }

    // Members can only resume their own memberships
    const targetMemberId = req.user?.staff ? existing.memberId : req.user?.member?.id;
    if (!targetMemberId || existing.memberId !== targetMemberId) {
      throw new ForbiddenError('You can only resume your own memberships');
    }

    const membership = await memberMembershipService.resume(id, targetMemberId);

    res.json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /memberships/:id/cancel
 * Cancel a membership
 */
export const cancelMembership = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get membership to check ownership
    const existing = await memberMembershipService.getById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership not found' },
      });
      return;
    }

    // Members can only cancel their own memberships
    const targetMemberId = req.user?.staff ? existing.memberId : req.user?.member?.id;
    if (!targetMemberId || existing.memberId !== targetMemberId) {
      throw new ForbiddenError('You can only cancel your own memberships');
    }

    const membership = await memberMembershipService.cancel(id, targetMemberId, reason);

    res.json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /memberships/check-booking
 * Check if member can book a specific class
 */
export const checkBookingEligibility = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.member) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Member profile required' },
      });
      return;
    }

    const { classTypeId, locationId } = req.query;

    if (!classTypeId || !locationId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'classTypeId and locationId are required' },
      });
      return;
    }

    const result = await memberMembershipService.canBookClass(
      req.user.member.id,
      classTypeId as string,
      locationId as string
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
