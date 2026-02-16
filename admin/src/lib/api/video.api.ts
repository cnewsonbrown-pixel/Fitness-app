import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { VideoProgram, Video, PaginatedResponse } from '@/types';

// Video Programs
export interface VideoListParams {
  page?: number;
  limit?: number;
  programId?: string;
  category?: string;
  search?: string;
}

export interface ProgramListParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category?: string;
  search?: string;
}

export interface CreateProgramData {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: number;
  isPublished?: boolean;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  programId?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
}

export interface VideoAnalytics {
  videoId: string;
  totalViews: number;
  uniqueViewers: number;
  avgWatchTime: number;
  completionRate: number;
  viewsByDay: { date: string; views: number }[];
}

export interface ProgramAnalytics {
  programId: string;
  totalViews: number;
  uniqueViewers: number;
  avgCompletionRate: number;
  popularVideos: { videoId: string; title: string; views: number }[];
}

export interface LibraryAnalytics {
  totalVideos: number;
  totalPrograms: number;
  totalViews: number;
  totalWatchTime: number;
  viewsByCategory: { category: string; views: number; percentage: number }[];
  topVideos: { videoId: string; title: string; views: number; completionRate: number }[];
  viewsTrend: { date: string; views: number }[];
}

export const videoProgramsApi = {
  list: (params?: ProgramListParams) =>
    apiGet<PaginatedResponse<VideoProgram>>('/video/programs', params as Record<string, unknown>),

  get: (id: string) => apiGet<VideoProgram>(`/video/programs/${id}`),

  create: (data: CreateProgramData) => apiPost<VideoProgram>('/video/programs', data),

  update: (id: string, data: Partial<CreateProgramData>) =>
    apiPut<VideoProgram>(`/video/programs/${id}`, data),

  delete: (id: string) => apiDelete(`/video/programs/${id}`),

  publish: (id: string) => apiPost<VideoProgram>(`/video/programs/${id}/publish`),

  unpublish: (id: string) => apiPost<VideoProgram>(`/video/programs/${id}/unpublish`),

  reorderVideos: (id: string, videoIds: string[]) =>
    apiPost<VideoProgram>(`/video/programs/${id}/reorder`, { videoIds }),

  getAnalytics: (id: string) => apiGet<ProgramAnalytics>(`/video/programs/${id}/analytics`),
};

export const videosApi = {
  list: (params?: VideoListParams) =>
    apiGet<PaginatedResponse<Video>>('/video/videos', params as Record<string, unknown>),

  get: (id: string) => apiGet<Video>(`/video/videos/${id}`),

  create: (data: CreateVideoData) => apiPost<Video>('/video/videos', data),

  update: (id: string, data: Partial<CreateVideoData>) =>
    apiPut<Video>(`/video/videos/${id}`, data),

  delete: (id: string) => apiDelete(`/video/videos/${id}`),

  publish: (id: string) => apiPost<Video>(`/video/videos/${id}/publish`),

  unpublish: (id: string) => apiPost<Video>(`/video/videos/${id}/unpublish`),

  getAnalytics: (id: string) => apiGet<VideoAnalytics>(`/video/videos/${id}/analytics`),

  getUploadUrl: () =>
    apiPost<{ uploadUrl: string; videoKey: string }>('/video/videos/upload-url'),
};

export const videoAnalyticsApi = {
  getLibraryAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    apiGet<LibraryAnalytics>('/video/analytics', params as Record<string, unknown>),
};
