import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Journey, Segment, PaginatedResponse, Member } from '@/types';

// Journeys
export interface JourneyListParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface JourneyStep {
  id: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WAIT' | 'CONDITION' | 'ACTION';
  name: string;
  config: Record<string, unknown>;
  nextStepId?: string;
  conditionTrueStepId?: string;
  conditionFalseStepId?: string;
  position: { x: number; y: number };
}

export interface CreateJourneyData {
  name: string;
  description?: string;
  trigger: 'SIGNUP' | 'MEMBERSHIP_PURCHASE' | 'CLASS_BOOKING' | 'INACTIVITY' | 'CUSTOM';
  triggerConfig?: Record<string, unknown>;
  segmentId?: string;
}

export interface UpdateJourneyData {
  name?: string;
  description?: string;
  trigger?: 'SIGNUP' | 'MEMBERSHIP_PURCHASE' | 'CLASS_BOOKING' | 'INACTIVITY' | 'CUSTOM';
  triggerConfig?: Record<string, unknown>;
  segmentId?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface JourneyStats {
  enrolled: number;
  active: number;
  completed: number;
  exited: number;
  conversionRate: number;
}

export const journeysApi = {
  list: (params?: JourneyListParams) =>
    apiGet<PaginatedResponse<Journey>>('/crm/journeys', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Journey & { steps: JourneyStep[] }>(`/crm/journeys/${id}`),

  create: (data: CreateJourneyData) => apiPost<Journey>('/crm/journeys', data),

  update: (id: string, data: UpdateJourneyData) => apiPut<Journey>(`/crm/journeys/${id}`, data),

  delete: (id: string) => apiDelete(`/crm/journeys/${id}`),

  // Steps
  getSteps: (id: string) => apiGet<JourneyStep[]>(`/crm/journeys/${id}/steps`),

  addStep: (id: string, step: Omit<JourneyStep, 'id'>) =>
    apiPost<JourneyStep>(`/crm/journeys/${id}/steps`, step),

  updateStep: (id: string, stepId: string, step: Partial<JourneyStep>) =>
    apiPut<JourneyStep>(`/crm/journeys/${id}/steps/${stepId}`, step),

  deleteStep: (id: string, stepId: string) => apiDelete(`/crm/journeys/${id}/steps/${stepId}`),

  // Enrollment
  getEnrollments: (id: string, params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<{ memberId: string; memberName: string; currentStep: string; enrolledAt: string }>>(
      `/crm/journeys/${id}/enrollments`,
      params as Record<string, unknown>
    ),

  enrollMember: (id: string, memberId: string) =>
    apiPost(`/crm/journeys/${id}/enrollments`, { memberId }),

  // Stats
  getStats: (id: string) => apiGet<JourneyStats>(`/crm/journeys/${id}/stats`),

  // Activate/Pause
  activate: (id: string) => apiPost<Journey>(`/crm/journeys/${id}/activate`),

  pause: (id: string) => apiPost<Journey>(`/crm/journeys/${id}/pause`),
};

// Segments
export interface SegmentListParams {
  page?: number;
  limit?: number;
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

export interface SegmentRuleGroup {
  logic: 'AND' | 'OR';
  rules: (SegmentRule | SegmentRuleGroup)[];
}

export interface CreateSegmentData {
  name: string;
  description?: string;
  rules: SegmentRuleGroup;
}

export interface UpdateSegmentData {
  name?: string;
  description?: string;
  rules?: SegmentRuleGroup;
}

export const segmentsApi = {
  list: (params?: SegmentListParams) =>
    apiGet<PaginatedResponse<Segment>>('/crm/segments', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Segment>(`/crm/segments/${id}`),

  create: (data: CreateSegmentData) => apiPost<Segment>('/crm/segments', data),

  update: (id: string, data: UpdateSegmentData) => apiPut<Segment>(`/crm/segments/${id}`, data),

  delete: (id: string) => apiDelete(`/crm/segments/${id}`),

  getMembers: (id: string, params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<Member>>(`/crm/segments/${id}/members`, params as Record<string, unknown>),

  refreshCount: (id: string) => apiPost<{ count: number }>(`/crm/segments/${id}/refresh`),

  preview: (rules: SegmentRuleGroup) =>
    apiPost<{ count: number; sampleMembers: Member[] }>('/crm/segments/preview', { rules }),
};

// Lead Scoring
export interface ScoringRule {
  id: string;
  name: string;
  condition: {
    type: 'ACTION' | 'ATTRIBUTE' | 'ENGAGEMENT';
    config: Record<string, unknown>;
  };
  points: number;
  isActive: boolean;
}

export interface ScoringLeaderboardEntry {
  memberId: string;
  memberName: string;
  memberEmail: string;
  score: number;
  rank: number;
}

export const scoringApi = {
  getRules: () => apiGet<ScoringRule[]>('/crm/scoring/rules'),

  createRule: (rule: Omit<ScoringRule, 'id'>) => apiPost<ScoringRule>('/crm/scoring/rules', rule),

  updateRule: (id: string, rule: Partial<ScoringRule>) =>
    apiPut<ScoringRule>(`/crm/scoring/rules/${id}`, rule),

  deleteRule: (id: string) => apiDelete(`/crm/scoring/rules/${id}`),

  getLeaderboard: (params?: { limit?: number }) =>
    apiGet<ScoringLeaderboardEntry[]>('/crm/scoring/leaderboard', params as Record<string, unknown>),

  getMemberScore: (memberId: string) =>
    apiGet<{ score: number; breakdown: { rule: string; points: number }[] }>(
      `/crm/scoring/members/${memberId}`
    ),
};

// Email Templates
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  content: string;
  category?: string;
}

export const templatesApi = {
  list: (params?: { category?: string }) =>
    apiGet<EmailTemplate[]>('/crm/templates', params as Record<string, unknown>),

  getById: (id: string) => apiGet<EmailTemplate>(`/crm/templates/${id}`),

  create: (data: CreateTemplateData) => apiPost<EmailTemplate>('/crm/templates', data),

  update: (id: string, data: Partial<CreateTemplateData>) =>
    apiPut<EmailTemplate>(`/crm/templates/${id}`, data),

  delete: (id: string) => apiDelete(`/crm/templates/${id}`),

  duplicate: (id: string) => apiPost<EmailTemplate>(`/crm/templates/${id}/duplicate`),
};
