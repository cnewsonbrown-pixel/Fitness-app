import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Staff, PaginatedResponse } from '@/types';

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'FRONT_DESK';
  locationId?: string;
  isActive?: boolean;
}

export interface CreateStaffData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'FRONT_DESK';
  locationIds?: string[];
  hourlyRate?: number;
  bio?: string;
  specialties?: string[];
}

export interface UpdateStaffData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'FRONT_DESK';
  locationIds?: string[];
  hourlyRate?: number;
  bio?: string;
  specialties?: string[];
  isActive?: boolean;
}

// Availability
export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  locationId?: string;
}

export interface SetAvailabilityData {
  slots: Omit<AvailabilitySlot, 'id'>[];
}

// Certifications
export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface AddCertificationData {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
}

// Pay
export interface PayPeriod {
  id: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalPay: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

export interface PaySummary {
  currentPeriodHours: number;
  currentPeriodPay: number;
  ytdHours: number;
  ytdPay: number;
  hourlyRate: number;
}

// Schedule
export interface ScheduledShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
  locationName: string;
  type: 'CLASS' | 'SHIFT';
  classSessionId?: string;
  className?: string;
}

// Metrics
export interface StaffMetrics {
  totalClasses: number;
  totalHours: number;
  averageAttendance: number;
  memberRating: number;
  noShowRate: number;
  popularClasses: { classTypeName: string; count: number }[];
}

export const staffApi = {
  list: (params?: StaffListParams) =>
    apiGet<PaginatedResponse<Staff>>('/staff', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Staff>(`/staff/${id}`),

  create: (data: CreateStaffData) => apiPost<Staff>('/staff', data),

  update: (id: string, data: UpdateStaffData) => apiPut<Staff>(`/staff/${id}`, data),

  delete: (id: string) => apiDelete(`/staff/${id}`),

  // Availability
  getAvailability: (id: string) => apiGet<AvailabilitySlot[]>(`/staff/${id}/availability`),

  setAvailability: (id: string, data: SetAvailabilityData) =>
    apiPut<AvailabilitySlot[]>(`/staff/${id}/availability`, data),

  // Certifications
  getCertifications: (id: string) => apiGet<Certification[]>(`/staff/${id}/certifications`),

  addCertification: (id: string, data: AddCertificationData) =>
    apiPost<Certification>(`/staff/${id}/certifications`, data),

  updateCertification: (id: string, certId: string, data: Partial<AddCertificationData>) =>
    apiPut<Certification>(`/staff/${id}/certifications/${certId}`, data),

  deleteCertification: (id: string, certId: string) =>
    apiDelete(`/staff/${id}/certifications/${certId}`),

  // Pay
  getPaySummary: (id: string) => apiGet<PaySummary>(`/staff/${id}/pay/summary`),

  getPayPeriods: (id: string, params?: { year?: number }) =>
    apiGet<PayPeriod[]>(`/staff/${id}/pay/periods`, params as Record<string, unknown>),

  // Schedule
  getSchedule: (id: string, params: { startDate: string; endDate: string }) =>
    apiGet<ScheduledShift[]>(`/staff/${id}/schedule`, params as Record<string, unknown>),

  // Metrics
  getMetrics: (id: string, params?: { startDate?: string; endDate?: string }) =>
    apiGet<StaffMetrics>(`/staff/${id}/metrics`, params as Record<string, unknown>),

  // Instructors specifically (for dropdowns)
  listInstructors: (params?: { locationId?: string; classTypeId?: string }) =>
    apiGet<Staff[]>('/staff/instructors', params as Record<string, unknown>),
};
