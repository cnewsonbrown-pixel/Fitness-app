import api from './api';

export interface VideoProgram {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  totalVideos: number;
  totalDuration: number; // in minutes
  completedVideos?: number;
  progress?: number;
}

export interface Video {
  id: string;
  programId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  vimeoId?: string;
  vimeoUrl?: string;
  duration: number; // in seconds
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPremium: boolean;
  order: number;
  isCompleted?: boolean;
  watchedSeconds?: number;
}

export interface VideoProgress {
  videoId: string;
  watchedSeconds: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

export const videoService = {
  // Programs
  getPrograms: async (params?: {
    category?: string;
    level?: string;
  }): Promise<VideoProgram[]> => {
    const response = await api.get('/video/programs', { params });
    return response.data.data;
  },

  getProgram: async (programId: string): Promise<VideoProgram> => {
    const response = await api.get(`/video/programs/${programId}`);
    return response.data.data;
  },

  getProgramVideos: async (programId: string): Promise<Video[]> => {
    const response = await api.get(`/video/programs/${programId}/videos`);
    return response.data.data;
  },

  // Videos
  getVideo: async (videoId: string): Promise<Video> => {
    const response = await api.get(`/video/${videoId}`);
    return response.data.data;
  },

  // Progress tracking
  updateProgress: async (
    videoId: string,
    watchedSeconds: number
  ): Promise<VideoProgress> => {
    const response = await api.post(`/video/${videoId}/progress`, {
      watchedSeconds,
    });
    return response.data.data;
  },

  markComplete: async (videoId: string): Promise<void> => {
    await api.post(`/video/${videoId}/complete`);
  },

  // Continue watching
  getContinueWatching: async (): Promise<Video[]> => {
    const response = await api.get('/video/continue-watching');
    return response.data.data;
  },

  // Recommendations
  getRecommended: async (): Promise<Video[]> => {
    const response = await api.get('/video/recommended');
    return response.data.data;
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/video/categories');
    return response.data.data;
  },
};
