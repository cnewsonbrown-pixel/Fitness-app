import { apiPost } from './api';
import { tokenStorage } from './api';
import { User, AuthTokens } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/login', credentials);
    await tokenStorage.setTokens(response.tokens);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/register', data);
    await tokenStorage.setTokens(response.tokens);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiPost<User>('/auth/me');
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiPost<{ tokens: AuthTokens }>('/auth/refresh', { refreshToken });
    await tokenStorage.setTokens(response.tokens);
    return response.tokens;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiPost('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiPost('/auth/reset-password', { token, password });
  },
};
