import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Campaign, LeadForm, PaginatedResponse } from '@/types';

// Campaigns
export interface CampaignListParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  type?: 'EMAIL' | 'SMS' | 'PUSH';
}

export interface CreateCampaignData {
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  content: string;
  segmentId?: string;
  scheduledAt?: string;
}

export interface UpdateCampaignData {
  name?: string;
  subject?: string;
  content?: string;
  segmentId?: string;
  scheduledAt?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

export const campaignsApi = {
  list: (params?: CampaignListParams) =>
    apiGet<PaginatedResponse<Campaign>>('/marketing/campaigns', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Campaign>(`/marketing/campaigns/${id}`),

  create: (data: CreateCampaignData) => apiPost<Campaign>('/marketing/campaigns', data),

  update: (id: string, data: UpdateCampaignData) =>
    apiPut<Campaign>(`/marketing/campaigns/${id}`, data),

  delete: (id: string) => apiDelete(`/marketing/campaigns/${id}`),

  send: (id: string) => apiPost<Campaign>(`/marketing/campaigns/${id}/send`),

  pause: (id: string) => apiPost<Campaign>(`/marketing/campaigns/${id}/pause`),

  resume: (id: string) => apiPost<Campaign>(`/marketing/campaigns/${id}/resume`),

  getStats: (id: string) => apiGet<CampaignStats>(`/marketing/campaigns/${id}/stats`),

  preview: (id: string) => apiGet<{ html: string; text: string }>(`/marketing/campaigns/${id}/preview`),
};

// Lead Forms
export interface LeadFormListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface LeadFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
}

export interface CreateLeadFormData {
  name: string;
  description?: string;
  fields: Omit<LeadFormField, 'id'>[];
  thankYouMessage?: string;
  redirectUrl?: string;
  notifyEmails?: string[];
}

export interface UpdateLeadFormData {
  name?: string;
  description?: string;
  fields?: Omit<LeadFormField, 'id'>[];
  thankYouMessage?: string;
  redirectUrl?: string;
  notifyEmails?: string[];
  isActive?: boolean;
}

export interface LeadFormSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedAt: string;
  converted: boolean;
  memberId?: string;
}

export const leadFormsApi = {
  list: (params?: LeadFormListParams) =>
    apiGet<PaginatedResponse<LeadForm>>('/marketing/lead-forms', params as Record<string, unknown>),

  getById: (id: string) => apiGet<LeadForm>(`/marketing/lead-forms/${id}`),

  create: (data: CreateLeadFormData) => apiPost<LeadForm>('/marketing/lead-forms', data),

  update: (id: string, data: UpdateLeadFormData) =>
    apiPut<LeadForm>(`/marketing/lead-forms/${id}`, data),

  delete: (id: string) => apiDelete(`/marketing/lead-forms/${id}`),

  getSubmissions: (id: string, params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<LeadFormSubmission>>(
      `/marketing/lead-forms/${id}/submissions`,
      params as Record<string, unknown>
    ),

  getEmbedCode: (id: string) => apiGet<{ embedCode: string }>(`/marketing/lead-forms/${id}/embed`),
};

// Leads
export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source: string;
  formId?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  score: number;
  createdAt: string;
  convertedAt?: string;
  memberId?: string;
}

export interface LeadListParams {
  page?: number;
  limit?: number;
  status?: Lead['status'];
  source?: string;
}

export const leadsApi = {
  list: (params?: LeadListParams) =>
    apiGet<PaginatedResponse<Lead>>('/marketing/leads', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Lead>(`/marketing/leads/${id}`),

  convert: (id: string) => apiPost<{ lead: Lead; memberId: string }>(`/marketing/leads/${id}/convert`),

  updateStatus: (id: string, status: Lead['status']) =>
    apiPut<Lead>(`/marketing/leads/${id}`, { status }),
};
