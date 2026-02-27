import { apiPost, apiGet } from './client';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  timezone: string;
  country: string;
  tier: 'BASE' | 'MID' | 'PREMIUM';
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: 'BASE' | 'MID' | 'PREMIUM';
}

export interface SlugCheckResponse {
  available: boolean;
}

export const signupApi = {
  register: (payload: RegisterPayload) =>
    apiPost<AuthResponse>('/auth/register', payload),

  createTenant: (payload: CreateTenantPayload, token: string) =>
    apiPost<Tenant>('/tenants', payload, token),

  checkSlug: (slug: string) =>
    apiGet<SlugCheckResponse>(`/tenants/check-slug/${slug}`),
};
