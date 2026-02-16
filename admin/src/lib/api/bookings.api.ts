import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Booking, PaginatedResponse } from '@/types';

export interface BookingListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  classSessionId?: string;
  status?: 'BOOKED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
}

export interface CreateBookingData {
  memberId: string;
  classSessionId: string;
}

export interface BookingStats {
  totalBookings: number;
  checkedIn: number;
  noShows: number;
  cancelled: number;
  checkInRate: number;
}

export const bookingsApi = {
  list: (params?: BookingListParams) =>
    apiGet<PaginatedResponse<Booking>>('/bookings', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Booking>(`/bookings/${id}`),

  create: (data: CreateBookingData) => apiPost<Booking>('/bookings', data),

  cancel: (id: string, reason?: string) =>
    apiPost<Booking>(`/bookings/${id}/cancel`, { reason }),

  checkIn: (id: string) => apiPost<Booking>(`/bookings/${id}/check-in`),

  markNoShow: (id: string) => apiPost<Booking>(`/bookings/${id}/no-show`),

  // Stats
  getStats: (params?: { startDate?: string; endDate?: string }) =>
    apiGet<BookingStats>('/bookings/stats', params as Record<string, unknown>),

  // Check eligibility (does member have valid membership/credits)
  checkEligibility: (memberId: string, classSessionId: string) =>
    apiGet<{ eligible: boolean; reason?: string }>('/bookings/check-eligibility', {
      memberId,
      classSessionId,
    }),
};
