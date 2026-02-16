import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Payment, PaginatedResponse } from '@/types';

// Payment Methods
export interface PaymentMethod {
  id: string;
  memberId: string;
  type: 'CARD' | 'BANK_ACCOUNT';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface SetupIntentResponse {
  clientSecret: string;
  setupIntentId: string;
}

// Subscriptions
export interface Subscription {
  id: string;
  memberId: string;
  membershipTypeId: string;
  membershipTypeName: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'PAST_DUE';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  interval: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  createdAt: string;
}

export interface SubscriptionListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  status?: string;
}

// Payments
export interface PaymentListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  status?: 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  startDate?: string;
  endDate?: string;
}

// Revenue
export interface RevenueSummary {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  refunds: number;
  netRevenue: number;
  growthRate: number;
  previousPeriodRevenue: number;
}

export interface RevenueByPeriod {
  date: string;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

export interface RevenueByType {
  type: string;
  revenue: number;
  percentage: number;
}

export const billingApi = {
  // Setup Intent (for adding payment methods)
  createSetupIntent: (memberId: string) =>
    apiPost<SetupIntentResponse>('/billing/setup-intent', { memberId }),

  // Payment Methods
  getPaymentMethods: (memberId: string) =>
    apiGet<PaymentMethod[]>(`/billing/members/${memberId}/payment-methods`),

  setDefaultPaymentMethod: (memberId: string, paymentMethodId: string) =>
    apiPost<PaymentMethod>(`/billing/members/${memberId}/payment-methods/${paymentMethodId}/default`),

  deletePaymentMethod: (memberId: string, paymentMethodId: string) =>
    apiDelete(`/billing/members/${memberId}/payment-methods/${paymentMethodId}`),

  // Subscriptions
  listSubscriptions: (params?: SubscriptionListParams) =>
    apiGet<PaginatedResponse<Subscription>>('/billing/subscriptions', params as Record<string, unknown>),

  getSubscription: (id: string) => apiGet<Subscription>(`/billing/subscriptions/${id}`),

  cancelSubscription: (id: string, immediately?: boolean) =>
    apiPost<Subscription>(`/billing/subscriptions/${id}/cancel`, { immediately }),

  pauseSubscription: (id: string) =>
    apiPost<Subscription>(`/billing/subscriptions/${id}/pause`),

  resumeSubscription: (id: string) =>
    apiPost<Subscription>(`/billing/subscriptions/${id}/resume`),

  // Payments
  listPayments: (params?: PaymentListParams) =>
    apiGet<PaginatedResponse<Payment>>('/billing/payments', params as Record<string, unknown>),

  getPayment: (id: string) => apiGet<Payment>(`/billing/payments/${id}`),

  refundPayment: (id: string, amount?: number, reason?: string) =>
    apiPost<Payment>(`/billing/payments/${id}/refund`, { amount, reason }),

  // Revenue
  getRevenueSummary: (params?: { startDate?: string; endDate?: string }) =>
    apiGet<RevenueSummary>('/billing/revenue/summary', params as Record<string, unknown>),

  getRevenueByPeriod: (params: { startDate: string; endDate: string; interval?: 'day' | 'week' | 'month' }) =>
    apiGet<RevenueByPeriod[]>('/billing/revenue/by-period', params as Record<string, unknown>),

  getRevenueByType: (params?: { startDate?: string; endDate?: string }) =>
    apiGet<RevenueByType[]>('/billing/revenue/by-type', params as Record<string, unknown>),

  // Member billing
  getMemberBilling: (memberId: string) =>
    apiGet<{
      paymentMethods: PaymentMethod[];
      subscriptions: Subscription[];
      recentPayments: Payment[];
      totalSpent: number;
    }>(`/billing/members/${memberId}`),
};
