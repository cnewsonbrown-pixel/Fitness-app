import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import {
  JwtPayload,
  TokenPair,
  RegisterPayload,
  LoginPayload,
  OAuthProfile,
  UserWithRelations,
} from '../types/index.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

export class AuthService {
  /**
   * Register a new user with email and password
   */
  async register(payload: RegisterPayload): Promise<{ user: UserWithRelations; tokens: TokenPair }> {
    const { email, password, firstName, lastName, tenantSlug } = payload;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Find tenant if slug provided
    let tenantId: string | undefined;
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError('Studio not found');
      }
      tenantId = tenant.id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        tenantId,
      },
      include: {
        tenant: true,
        member: true,
        staff: true,
      },
    });

    // If user joined a tenant, create member profile
    if (tenantId) {
      await prisma.member.create({
        data: {
          tenantId,
          userId: user.id,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Login with email and password
   */
  async login(payload: LoginPayload): Promise<{ user: UserWithRelations; tokens: TokenPair }> {
    const { email, password } = payload;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: true,
        member: true,
        staff: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Handle OAuth login/registration
   */
  async oauthLogin(profile: OAuthProfile): Promise<{ user: UserWithRelations; tokens: TokenPair }> {
    const { provider, providerId, email, firstName, lastName, profileImageUrl } = profile;

    // Look for existing user by provider ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          provider === 'google' ? { googleId: providerId } : { appleId: providerId },
          { email: email.toLowerCase() },
        ],
      },
      include: {
        tenant: true,
        member: true,
        staff: true,
      },
    });

    if (user) {
      // Update OAuth ID if not set
      const updateData: Record<string, string> = {};
      if (provider === 'google' && !user.googleId) {
        updateData.googleId = providerId;
      } else if (provider === 'apple' && !user.appleId) {
        updateData.appleId = providerId;
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...updateData,
            lastLoginAt: new Date(),
          },
          include: {
            tenant: true,
            member: true,
            staff: true,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          profileImageUrl,
          isEmailVerified: true, // OAuth emails are verified
          ...(provider === 'google' ? { googleId: providerId } : { appleId: providerId }),
        },
        include: {
          tenant: true,
          member: true,
          staff: true,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Revoke old refresh token (token rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Get user with relations
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      include: {
        tenant: true,
        member: true,
        staff: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        member: true,
        staff: true,
      },
    });
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type');
      }
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: UserWithRelations): Promise<TokenPair> {
    const accessPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId ?? undefined,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId ?? undefined,
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    // Calculate refresh token expiry
    const refreshExpiresIn = this.parseExpiresIn(config.jwt.refreshExpiresIn);
    const expiresAt = new Date(Date.now() + refreshExpiresIn);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Calculate access token expiry in seconds
    const expiresIn = this.parseExpiresIn(config.jwt.expiresIn) / 1000;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Parse expires in string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60 * 1000; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }
}

export const authService = new AuthService();
