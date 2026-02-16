import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { StaffRole } from '@prisma/client';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);

    // Get user from database
    const user = await authService.getUserById(payload.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId ?? undefined,
      member: user.member ?? undefined,
      staff: user.staff ?? undefined,
    };

    req.tenantId = user.tenantId ?? undefined;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require a specific tenant context
 */
export const requireTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tenantId) {
    next(new ForbiddenError('Tenant context required'));
    return;
  }
  next();
};

/**
 * Middleware to require staff role
 */
export const requireStaff = (allowedRoles?: StaffRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.staff) {
      next(new ForbiddenError('Staff access required'));
      return;
    }

    if (allowedRoles && !allowedRoles.includes(req.user.staff.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Middleware to require member profile
 */
export const requireMember = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.member) {
    next(new ForbiddenError('Member access required'));
    return;
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);

    const user = await authService.getUserById(payload.userId);

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId ?? undefined,
        member: user.member ?? undefined,
        staff: user.staff ?? undefined,
      };
      req.tenantId = user.tenantId ?? undefined;
    }

    next();
  } catch {
    // Ignore token errors for optional auth
    next();
  }
};
