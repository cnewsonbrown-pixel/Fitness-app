import { apiPost, apiGet, tokenStorage } from './client';
import { User, AuthTokens, AuthResponse, LoginPayload, RegisterPayload, Tenant } from '@/types';

export const authApi = {
  async login(credentials: LoginPayload): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/login', credentials);
    tokenStorage.setTokens(response.tokens);
    return response;
  },

  async register(data: RegisterPayload): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/register', data);
    tokenStorage.setTokens(response.tokens);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async getMe(): Promise<User> {
    return apiGet<User>('/auth/me');
  },

  async getCurrentTenant(): Promise<Tenant> {
    return apiGet<Tenant>('/tenants/current');
  },

  async forgotPassword(email: string): Promise<void> {
    await apiPost('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiPost('/auth/reset-password', { token, password });
  },
};
