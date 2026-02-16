import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { ClassType, ClassSession, PaginatedResponse } from '@/types';

// Class Types API
export interface ClassTypeListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateClassTypeData {
  name: string;
  description?: string;
  duration: number;
  capacity: number;
  color?: string;
  requiredCertifications?: string[];
}

export interface UpdateClassTypeData {
  name?: string;
  description?: string;
  duration?: number;
  capacity?: number;
  color?: string;
  requiredCertifications?: string[];
  isActive?: boolean;
}

export const classTypesApi = {
  list: (params?: ClassTypeListParams) =>
    apiGet<PaginatedResponse<ClassType>>('/class-types', params as Record<string, unknown>),

  getById: (id: string) => apiGet<ClassType>(`/class-types/${id}`),

  create: (data: CreateClassTypeData) => apiPost<ClassType>('/class-types', data),

  update: (id: string, data: UpdateClassTypeData) => apiPut<ClassType>(`/class-types/${id}`, data),

  delete: (id: string) => apiDelete(`/class-types/${id}`),
};

// Class Sessions API
export interface ClassSessionListParams {
  page?: number;
  limit?: number;
  locationId?: string;
  classTypeId?: string;
  instructorId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface CreateClassSessionData {
  classTypeId: string;
  locationId: string;
  instructorId: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateClassSessionData {
  instructorId?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  notes?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface RosterMember {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string;
  status: 'BOOKED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
  bookedAt: string;
  checkedInAt?: string;
}

export interface WaitlistMember {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string;
  position: number;
  addedAt: string;
}

export interface SessionStats {
  totalBooked: number;
  checkedIn: number;
  noShows: number;
  cancelled: number;
  waitlistCount: number;
  fillRate: number;
}

export const classSessionsApi = {
  list: (params?: ClassSessionListParams) =>
    apiGet<PaginatedResponse<ClassSession>>('/class-sessions', params as Record<string, unknown>),

  getById: (id: string) => apiGet<ClassSession>(`/class-sessions/${id}`),

  create: (data: CreateClassSessionData) => apiPost<ClassSession>('/class-sessions', data),

  update: (id: string, data: UpdateClassSessionData) => apiPut<ClassSession>(`/class-sessions/${id}`, data),

  delete: (id: string) => apiDelete(`/class-sessions/${id}`),

  // Roster management
  getRoster: (id: string) => apiGet<RosterMember[]>(`/class-sessions/${id}/roster`),

  checkIn: (id: string, bookingId: string) =>
    apiPost<RosterMember>(`/class-sessions/${id}/roster/${bookingId}/check-in`),

  markNoShow: (id: string, bookingId: string) =>
    apiPost<RosterMember>(`/class-sessions/${id}/roster/${bookingId}/no-show`),

  // Waitlist management
  getWaitlist: (id: string) => apiGet<WaitlistMember[]>(`/class-sessions/${id}/waitlist`),

  promoteFromWaitlist: (id: string, waitlistId: string) =>
    apiPost<RosterMember>(`/class-sessions/${id}/waitlist/${waitlistId}/promote`),

  removeFromWaitlist: (id: string, waitlistId: string) =>
    apiDelete(`/class-sessions/${id}/waitlist/${waitlistId}`),

  // Session lifecycle
  start: (id: string) => apiPost<ClassSession>(`/class-sessions/${id}/start`),

  complete: (id: string) => apiPost<ClassSession>(`/class-sessions/${id}/complete`),

  cancel: (id: string, reason?: string) =>
    apiPost<ClassSession>(`/class-sessions/${id}/cancel`, { reason }),

  // Stats
  getStats: (id: string) => apiGet<SessionStats>(`/class-sessions/${id}/stats`),

  // Schedule view (week)
  getSchedule: (params: { locationId?: string; startDate: string; endDate: string }) =>
    apiGet<ClassSession[]>('/class-sessions/schedule', params as Record<string, unknown>),
};
