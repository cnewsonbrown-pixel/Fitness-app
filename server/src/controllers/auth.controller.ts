import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../utils/validators.js';

/**
 * Format user for API response (exclude sensitive fields)
 */
const formatUserResponse = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  isEmailVerified: boolean;
  tenantId?: string | null;
  createdAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  profileImageUrl: user.profileImageUrl,
  isEmailVerified: user.isEmailVerified,
  tenantId: user.tenantId,
  createdAt: user.createdAt,
});

/**
 * POST /auth/register
 * Register a new user
 */
export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, tokens } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        user: formatUserResponse(user),
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Login with email and password
 */
export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, tokens } = await authService.login(req.body);

    res.json({
      success: true,
      data: {
        user: formatUserResponse(user),
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Refresh access token
 */
export const refresh = async (
  req: Request<unknown, unknown, RefreshTokenInput>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout current session
 */
export const logout = async (
  req: Request<unknown, unknown, RefreshTokenInput>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.logout(req.body.refreshToken);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout-all
 * Logout from all devices
 */
export const logoutAll = async (
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

    await authService.logoutAll(req.user.id);

    res.json({
      success: true,
      data: { message: 'Logged out from all devices' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 * Get current user profile
 */
export const me = async (
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

    const user = await authService.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: formatUserResponse(user),
        member: user.member,
        staff: user.staff,
        tenant: user.tenant,
      },
    });
  } catch (error) {
    next(error);
  }
};
