import { User, Tenant, Member, Staff } from '@prisma/client';
import { Request } from 'express';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  tenantId?: string;
}

// User payload stored in JWT
export interface JwtPayload {
  userId: string;
  email: string;
  tenantId?: string;
  type: 'access' | 'refresh';
}

// Authenticated user object attached to request
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
  member?: Member;
  staff?: Staff;
}

// Token pair returned on login
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Registration payload
export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug?: string; // Optional: join existing tenant
}

// Login payload
export interface LoginPayload {
  email: string;
  password: string;
}

// OAuth profile from providers
export interface OAuthProfile {
  provider: 'google' | 'apple';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>[];
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// User with relations
export interface UserWithRelations extends User {
  tenant?: Tenant | null;
  member?: Member | null;
  staff?: Staff | null;
}
