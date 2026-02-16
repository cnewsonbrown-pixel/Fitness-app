import { apiGet, apiPost, apiPatch } from './api';
import {
  Member,
  Membership,
  Booking,
  ClassSession,
  Badge,
  Challenge,
  PointTransaction,
  Article,
  Video,
  VideoProgram,
  PaginatedResponse,
} from '../types';

export const memberService = {
  // Profile
  async getProfile(): Promise<Member> {
    return apiGet<Member>('/members/me');
  },

  async updateProfile(data: Partial<Member>): Promise<Member> {
    return apiPatch<Member>('/members/me', data);
  },

  // Memberships
  async getMemberships(): Promise<Membership[]> {
    return apiGet<Membership[]>('/memberships/me');
  },

  async pauseMembership(membershipId: string, pauseEndDate?: string): Promise<Membership> {
    return apiPost<Membership>(`/memberships/${membershipId}/pause`, { pauseEndDate });
  },

  async resumeMembership(membershipId: string): Promise<Membership> {
    return apiPost<Membership>(`/memberships/${membershipId}/resume`);
  },

  // Bookings
  async getBookings(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Booking[]> {
    return apiGet<Booking[]>('/bookings/me', params);
  },

  async getUpcomingBookings(): Promise<Booking[]> {
    return apiGet<Booking[]>('/bookings/me/upcoming');
  },

  async createBooking(classSessionId: string): Promise<Booking> {
    return apiPost<Booking>('/bookings', { classSessionId });
  },

  async cancelBooking(bookingId: string): Promise<void> {
    return apiPost(`/bookings/${bookingId}/cancel`);
  },

  async checkIn(bookingId: string): Promise<Booking> {
    return apiPost<Booking>(`/bookings/${bookingId}/check-in`);
  },

  async checkInWithQR(qrCode: string): Promise<Booking> {
    return apiPost<Booking>('/bookings/check-in/qr', { qrCode });
  },

  // Classes
  async getSchedule(params: {
    startDate: string;
    endDate: string;
    locationId?: string;
    classTypeId?: string;
  }): Promise<ClassSession[]> {
    return apiGet<ClassSession[]>('/classes', params);
  },

  async getClassDetails(classId: string): Promise<ClassSession> {
    return apiGet<ClassSession>(`/classes/${classId}`);
  },

  // Gamification
  async getBadges(): Promise<Badge[]> {
    return apiGet<Badge[]>('/gamification/badges/me');
  },

  async getChallenges(): Promise<Challenge[]> {
    return apiGet<Challenge[]>('/gamification/challenges');
  },

  async joinChallenge(challengeId: string): Promise<void> {
    return apiPost(`/gamification/challenges/${challengeId}/join`);
  },

  async getPointHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PointTransaction>> {
    return apiGet<PaginatedResponse<PointTransaction>>('/gamification/points/history', params);
  },

  async getLeaderboard(): Promise<Array<{ memberId: string; name: string; points: number; rank: number }>> {
    return apiGet('/gamification/leaderboard');
  },

  // Content
  async getArticles(params?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Article>> {
    return apiGet<PaginatedResponse<Article>>('/content/articles', params);
  },

  async getArticle(articleId: string): Promise<Article> {
    return apiGet<Article>(`/content/articles/${articleId}`);
  },

  async bookmarkArticle(articleId: string): Promise<void> {
    return apiPost(`/content/articles/${articleId}/bookmark`);
  },

  async unbookmarkArticle(articleId: string): Promise<void> {
    return apiPost(`/content/articles/${articleId}/unbookmark`);
  },

  async getBookmarkedArticles(): Promise<Article[]> {
    return apiGet<Article[]>('/content/articles/bookmarks');
  },

  // Videos
  async getVideoPrograms(): Promise<VideoProgram[]> {
    return apiGet<VideoProgram[]>('/video/programs');
  },

  async getProgramVideos(programId: string): Promise<Video[]> {
    return apiGet<Video[]>(`/video/programs/${programId}/videos`);
  },

  async getVideo(videoId: string): Promise<Video> {
    return apiGet<Video>(`/video/${videoId}`);
  },

  async updateVideoProgress(videoId: string, watchedSeconds: number): Promise<void> {
    return apiPost(`/video/${videoId}/progress`, { watchedSeconds });
  },

  async markVideoComplete(videoId: string): Promise<void> {
    return apiPost(`/video/${videoId}/complete`);
  },
};
