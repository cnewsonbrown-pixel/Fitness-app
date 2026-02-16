import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './client';
import { Member, PaginatedResponse, MemberMembership, LifecycleStage } from '@/types';

export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  lifecycleStage?: LifecycleStage;
  tags?: string[];
}

export interface CreateMemberData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateMemberData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface MemberStats {
  totalBookings: number;
  attendedClasses: number;
  noShows: number;
  attendanceRate: number;
  totalSpent: number;
  memberSince: string;
}

export const membersApi = {
  list: (params?: MemberListParams) => apiGet<PaginatedResponse<Member>>('/members', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Member>(`/members/${id}`),

  create: (data: CreateMemberData) => apiPost<Member>('/members', data),

  update: (id: string, data: UpdateMemberData) => apiPut<Member>(`/members/${id}`, data),

  delete: (id: string) => apiDelete(`/members/${id}`),

  getStats: (id: string) => apiGet<MemberStats>(`/members/${id}/stats`),

  getMemberships: (id: string) => apiGet<MemberMembership[]>(`/members/${id}/memberships`),

  addTags: (id: string, tags: string[]) => apiPost(`/members/${id}/tags`, { tags }),

  removeTag: (id: string, tag: string) => apiDelete(`/members/${id}/tags/${tag}`),

  updateLifecycleStage: (id: string, stage: LifecycleStage) =>
    apiPatch<Member>(`/members/${id}/lifecycle-stage`, { lifecycleStage: stage }),
};
