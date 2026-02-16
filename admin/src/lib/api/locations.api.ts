import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Location, PaginatedResponse } from '@/types';

export interface LocationListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateLocationData {
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

export interface LocationStats {
  memberCount: number;
  activeClassCount: number;
  staffCount: number;
  monthlyBookings: number;
}

export const locationsApi = {
  list: (params?: LocationListParams) =>
    apiGet<PaginatedResponse<Location>>('/locations', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Location>(`/locations/${id}`),

  create: (data: CreateLocationData) => apiPost<Location>('/locations', data),

  update: (id: string, data: UpdateLocationData) => apiPut<Location>(`/locations/${id}`, data),

  delete: (id: string) => apiDelete(`/locations/${id}`),

  getStats: (id: string) => apiGet<LocationStats>(`/locations/${id}/stats`),
};
