import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as oauthController from '../controllers/oauth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../utils/validators.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current session
 * @access  Public
 */
router.post(
  '/logout',
  validate(refreshTokenSchema),
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.me
);

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', oauthController.googleAuth);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', oauthController.googleCallback);

/**
 * @route   POST /api/v1/auth/login/social
 * @desc    Social login for mobile apps
 * @access  Public
 */
router.post('/login/social', oauthController.socialLogin);

export default router;
