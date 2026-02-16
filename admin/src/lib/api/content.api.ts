import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Article, Announcement, PaginatedResponse } from '@/types';

// Articles
export interface ArticleListParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category?: string;
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  coverImageUrl?: string;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  coverImageUrl?: string;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export const articlesApi = {
  list: (params?: ArticleListParams) =>
    apiGet<PaginatedResponse<Article>>('/content/articles', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Article>(`/content/articles/${id}`),

  create: (data: CreateArticleData) => apiPost<Article>('/content/articles', data),

  update: (id: string, data: UpdateArticleData) => apiPut<Article>(`/content/articles/${id}`, data),

  delete: (id: string) => apiDelete(`/content/articles/${id}`),

  publish: (id: string) => apiPost<Article>(`/content/articles/${id}/publish`),

  unpublish: (id: string) => apiPost<Article>(`/content/articles/${id}/unpublish`),

  getCategories: () => apiGet<string[]>('/content/articles/categories'),
};

// Announcements
export interface AnnouncementListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  startDate?: string;
  endDate?: string;
  targetAudience?: 'ALL' | 'MEMBERS' | 'STAFF';
  locationIds?: string[];
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  startDate?: string;
  endDate?: string;
  targetAudience?: 'ALL' | 'MEMBERS' | 'STAFF';
  locationIds?: string[];
  isActive?: boolean;
}

export const announcementsApi = {
  list: (params?: AnnouncementListParams) =>
    apiGet<PaginatedResponse<Announcement>>('/content/announcements', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Announcement>(`/content/announcements/${id}`),

  create: (data: CreateAnnouncementData) => apiPost<Announcement>('/content/announcements', data),

  update: (id: string, data: UpdateAnnouncementData) =>
    apiPut<Announcement>(`/content/announcements/${id}`, data),

  delete: (id: string) => apiDelete(`/content/announcements/${id}`),

  activate: (id: string) => apiPost<Announcement>(`/content/announcements/${id}/activate`),

  deactivate: (id: string) => apiPost<Announcement>(`/content/announcements/${id}/deactivate`),
};
