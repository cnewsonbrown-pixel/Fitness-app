import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { PaginatedResponse } from '@/types';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  success: boolean;
  duration: number;
  createdAt: string;
}

export interface CreateWebhookData {
  name: string;
  url: string;
  events: string[];
}

export interface UpdateWebhookData {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
}

export interface WebhookListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface WebhookLogParams {
  page?: number;
  limit?: number;
  success?: boolean;
}

export const webhooksApi = {
  list: (params?: WebhookListParams) =>
    apiGet<PaginatedResponse<Webhook>>('/webhooks', params as Record<string, unknown>),

  get: (id: string) => apiGet<Webhook>(`/webhooks/${id}`),

  create: (data: CreateWebhookData) => apiPost<Webhook>('/webhooks', data),

  update: (id: string, data: UpdateWebhookData) =>
    apiPut<Webhook>(`/webhooks/${id}`, data),

  delete: (id: string) => apiDelete(`/webhooks/${id}`),

  test: (id: string) =>
    apiPost<{ success: boolean; responseStatus?: number; responseBody?: string }>(
      `/webhooks/${id}/test`
    ),

  rotateSecret: (id: string) => apiPost<Webhook>(`/webhooks/${id}/rotate-secret`),

  getLogs: (id: string, params?: WebhookLogParams) =>
    apiGet<PaginatedResponse<WebhookLog>>(`/webhooks/${id}/logs`, params as Record<string, unknown>),

  getEvents: () =>
    apiGet<{ key: string; label: string; description: string }[]>('/webhooks/events'),
};
