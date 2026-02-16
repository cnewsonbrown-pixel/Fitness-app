import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { MembershipType, MemberMembership, PaginatedResponse } from '@/types';

// Membership Types API
export interface MembershipTypeListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'RECURRING' | 'CLASS_PACK' | 'DROP_IN';
  isActive?: boolean;
}

export interface CreateMembershipTypeData {
  name: string;
  type: 'RECURRING' | 'CLASS_PACK' | 'DROP_IN';
  price: number;
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  classCredits?: number;
  description?: string;
}

export interface UpdateMembershipTypeData {
  name?: string;
  price?: number;
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  classCredits?: number;
  description?: string;
}

export interface MembershipTypeStats {
  activeCount: number;
  totalRevenue: number;
  averageRetention: number;
}

export const membershipTypesApi = {
  list: (params?: MembershipTypeListParams) =>
    apiGet<PaginatedResponse<MembershipType>>('/membership-types', params as Record<string, unknown>),

  getById: (id: string) => apiGet<MembershipType>(`/membership-types/${id}`),

  create: (data: CreateMembershipTypeData) => apiPost<MembershipType>('/membership-types', data),

  update: (id: string, data: UpdateMembershipTypeData) => apiPut<MembershipType>(`/membership-types/${id}`, data),

  delete: (id: string) => apiDelete(`/membership-types/${id}`),

  getStats: (id: string) => apiGet<MembershipTypeStats>(`/membership-types/${id}/stats`),
};

// Member Memberships API
export interface MemberMembershipListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  status?: string;
}

export interface CreateMemberMembershipData {
  memberId: string;
  membershipTypeId: string;
}

export const memberMembershipsApi = {
  list: (params?: MemberMembershipListParams) =>
    apiGet<PaginatedResponse<MemberMembership>>('/memberships', params as Record<string, unknown>),

  getById: (id: string) => apiGet<MemberMembership>(`/memberships/${id}`),

  create: (data: CreateMemberMembershipData) => apiPost<MemberMembership>('/memberships', data),

  pause: (id: string) => apiPost<MemberMembership>(`/memberships/${id}/pause`),

  resume: (id: string) => apiPost<MemberMembership>(`/memberships/${id}/resume`),

  cancel: (id: string) => apiPost<MemberMembership>(`/memberships/${id}/cancel`),

  checkBooking: (membershipId: string) => apiGet<{ eligible: boolean; reason?: string }>('/memberships/check-booking', { membershipId }),
};
