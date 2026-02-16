import { apiGet, apiPost, apiDelete } from './client';
import { PaginatedResponse } from '@/types';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secretKey: string; // Only returned once on creation
}

export interface ApiKeyListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const apiKeysApi = {
  list: (params?: ApiKeyListParams) =>
    apiGet<PaginatedResponse<ApiKey>>('/api-keys', params as Record<string, unknown>),

  get: (id: string) => apiGet<ApiKey>(`/api-keys/${id}`),

  create: (data: CreateApiKeyData) =>
    apiPost<CreateApiKeyResponse>('/api-keys', data),

  revoke: (id: string) => apiPost<ApiKey>(`/api-keys/${id}/revoke`),

  rotate: (id: string) =>
    apiPost<CreateApiKeyResponse>(`/api-keys/${id}/rotate`),

  delete: (id: string) => apiDelete(`/api-keys/${id}`),

  getPermissions: () =>
    apiGet<{ key: string; label: string; description: string }[]>('/api-keys/permissions'),
};
