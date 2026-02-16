import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { config } from '../config/index.js';
import { TokenPair, UserWithRelations } from '../types/index.js';

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    'google',
    { session: false },
    (err: Error | null, result: { user: UserWithRelations; tokens: TokenPair } | false) => {
      if (err) {
        console.error('Google OAuth error:', err);
        const errorUrl = new URL('/auth/error', config.frontendUrl);
        errorUrl.searchParams.set('error', 'oauth_failed');
        res.redirect(errorUrl.toString());
        return;
      }

      if (!result) {
        const errorUrl = new URL('/auth/error', config.frontendUrl);
        errorUrl.searchParams.set('error', 'oauth_denied');
        res.redirect(errorUrl.toString());
        return;
      }

      // Redirect to frontend with tokens
      const successUrl = new URL('/auth/callback', config.frontendUrl);
      successUrl.searchParams.set('accessToken', result.tokens.accessToken);
      successUrl.searchParams.set('refreshToken', result.tokens.refreshToken);
      successUrl.searchParams.set('expiresIn', result.tokens.expiresIn.toString());

      res.redirect(successUrl.toString());
    }
  )(req, res, next);
};

/**
 * POST /auth/login/social
 * Handle social login with token from mobile app
 */
export const socialLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // This endpoint would verify tokens from mobile SDKs
  // For Google: verify ID token with Google API
  // For Apple: verify identity token with Apple API

  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Mobile social login not yet implemented',
    },
  });
};
