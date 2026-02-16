import { apiGet, apiPost } from './api';
import { ClassSession, Booking, Member, Staff } from '../types';

export interface PaySummary {
  totalEarnings: number;
  classCount: number;
  period: {
    start: string;
    end: string;
  };
  breakdown: Array<{
    date: string;
    className: string;
    rate: number;
    attendeeCount: number;
  }>;
}

export interface SubstituteRequest {
  id: string;
  classSession: ClassSession;
  requestedBy: Staff;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  notes?: string;
  createdAt: string;
}

export const instructorService = {
  // Schedule
  async getMySchedule(params: {
    startDate: string;
    endDate: string;
  }): Promise<ClassSession[]> {
    return apiGet<ClassSession[]>('/staff/me/schedule', params);
  },

  async getTodaysClasses(): Promise<ClassSession[]> {
    const today = new Date().toISOString().split('T')[0];
    return apiGet<ClassSession[]>('/staff/me/schedule', {
      startDate: today,
      endDate: today,
    });
  },

  async getUpcomingClasses(days: number = 7): Promise<ClassSession[]> {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return apiGet<ClassSession[]>('/staff/me/schedule', { startDate, endDate });
  },

  // Class Management
  async getClassRoster(classId: string): Promise<Booking[]> {
    return apiGet<Booking[]>(`/classes/${classId}/roster`);
  },

  async getClassWaitlist(classId: string): Promise<Booking[]> {
    return apiGet<Booking[]>(`/classes/${classId}/waitlist`);
  },

  async checkInMember(bookingId: string): Promise<Booking> {
    return apiPost<Booking>(`/bookings/${bookingId}/check-in`);
  },

  async markNoShow(bookingId: string): Promise<Booking> {
    return apiPost<Booking>(`/bookings/${bookingId}/no-show`);
  },

  async getMemberDetails(memberId: string): Promise<Member> {
    return apiGet<Member>(`/members/${memberId}`);
  },

  // Substitute Requests
  async createSubRequest(classId: string, reason?: string): Promise<SubstituteRequest> {
    return apiPost<SubstituteRequest>(`/classes/${classId}/substitute-request`, { reason });
  },

  async getMySubRequests(): Promise<SubstituteRequest[]> {
    return apiGet<SubstituteRequest[]>('/staff/me/substitute-requests');
  },

  async getAvailableSubRequests(): Promise<SubstituteRequest[]> {
    return apiGet<SubstituteRequest[]>('/staff/substitute-requests/available');
  },

  async acceptSubRequest(requestId: string): Promise<SubstituteRequest> {
    return apiPost<SubstituteRequest>(`/staff/substitute-requests/${requestId}/accept`);
  },

  async declineSubRequest(requestId: string): Promise<SubstituteRequest> {
    return apiPost<SubstituteRequest>(`/staff/substitute-requests/${requestId}/decline`);
  },

  async cancelSubRequest(requestId: string): Promise<void> {
    return apiPost(`/staff/substitute-requests/${requestId}/cancel`);
  },

  // Pay
  async getPaySummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PaySummary> {
    return apiGet<PaySummary>('/staff/me/pay-summary', params);
  },

  async getPayHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: PaySummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return apiGet('/staff/me/pay-history', params);
  },

  // Profile
  async getMyStaffProfile(): Promise<Staff> {
    return apiGet<Staff>('/staff/me');
  },

  async updateAvailability(availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    locationId: string;
  }>): Promise<void> {
    return apiPost('/staff/me/availability', { availability });
  },
};
