import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Badge, Challenge, PaginatedResponse, Member } from '@/types';

// Points
export interface PointsTransaction {
  id: string;
  memberId: string;
  memberName: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface PointsLeaderboardEntry {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  totalPoints: number;
  rank: number;
}

export interface AwardPointsData {
  memberId: string;
  points: number;
  reason: string;
}

export const pointsApi = {
  award: (data: AwardPointsData) => apiPost<PointsTransaction>('/gamification/points/award', data),

  getLeaderboard: (params?: { limit?: number; period?: 'week' | 'month' | 'all' }) =>
    apiGet<PointsLeaderboardEntry[]>('/gamification/points/leaderboard', params as Record<string, unknown>),

  getMemberHistory: (memberId: string, params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<PointsTransaction>>(
      `/gamification/points/members/${memberId}`,
      params as Record<string, unknown>
    ),

  getMemberBalance: (memberId: string) =>
    apiGet<{ totalPoints: number; availablePoints: number }>(`/gamification/points/members/${memberId}/balance`),
};

// Badges
export interface BadgeListParams {
  page?: number;
  limit?: number;
  category?: string;
}

export interface CreateBadgeData {
  name: string;
  description: string;
  iconUrl?: string;
  category?: string;
  criteria: {
    type: 'MANUAL' | 'AUTO';
    condition?: string;
    threshold?: number;
  };
  pointsValue?: number;
}

export interface UpdateBadgeData {
  name?: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  criteria?: {
    type: 'MANUAL' | 'AUTO';
    condition?: string;
    threshold?: number;
  };
  pointsValue?: number;
  isActive?: boolean;
}

export interface BadgeAward {
  id: string;
  badgeId: string;
  memberId: string;
  memberName: string;
  awardedAt: string;
}

export const badgesApi = {
  list: (params?: BadgeListParams) =>
    apiGet<PaginatedResponse<Badge>>('/gamification/badges', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Badge>(`/gamification/badges/${id}`),

  create: (data: CreateBadgeData) => apiPost<Badge>('/gamification/badges', data),

  update: (id: string, data: UpdateBadgeData) => apiPut<Badge>(`/gamification/badges/${id}`, data),

  delete: (id: string) => apiDelete(`/gamification/badges/${id}`),

  award: (badgeId: string, memberId: string) =>
    apiPost<BadgeAward>(`/gamification/badges/${badgeId}/award`, { memberId }),

  getAwards: (badgeId: string, params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<BadgeAward>>(
      `/gamification/badges/${badgeId}/awards`,
      params as Record<string, unknown>
    ),

  getMemberBadges: (memberId: string) =>
    apiGet<Badge[]>(`/gamification/badges/members/${memberId}`),
};

// Challenges
export interface ChallengeListParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface CreateChallengeData {
  name: string;
  description: string;
  type: 'ATTENDANCE' | 'CLASSES' | 'STREAK' | 'CUSTOM';
  goal: number;
  startDate: string;
  endDate: string;
  pointsReward: number;
  badgeId?: string;
  rules?: Record<string, unknown>;
}

export interface UpdateChallengeData {
  name?: string;
  description?: string;
  goal?: number;
  startDate?: string;
  endDate?: string;
  pointsReward?: number;
  badgeId?: string;
  rules?: Record<string, unknown>;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface ChallengeProgress {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  progress: number;
  goal: number;
  percentComplete: number;
  completed: boolean;
  completedAt?: string;
}

export interface ChallengeLeaderboard {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  progress: number;
  rank: number;
}

export const challengesApi = {
  list: (params?: ChallengeListParams) =>
    apiGet<PaginatedResponse<Challenge>>('/gamification/challenges', params as Record<string, unknown>),

  getById: (id: string) => apiGet<Challenge>(`/gamification/challenges/${id}`),

  create: (data: CreateChallengeData) => apiPost<Challenge>('/gamification/challenges', data),

  update: (id: string, data: UpdateChallengeData) =>
    apiPut<Challenge>(`/gamification/challenges/${id}`, data),

  delete: (id: string) => apiDelete(`/gamification/challenges/${id}`),

  activate: (id: string) => apiPost<Challenge>(`/gamification/challenges/${id}/activate`),

  complete: (id: string) => apiPost<Challenge>(`/gamification/challenges/${id}/complete`),

  cancel: (id: string) => apiPost<Challenge>(`/gamification/challenges/${id}/cancel`),

  getProgress: (id: string, params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<ChallengeProgress>>(
      `/gamification/challenges/${id}/progress`,
      params as Record<string, unknown>
    ),

  getLeaderboard: (id: string, params?: { limit?: number }) =>
    apiGet<ChallengeLeaderboard[]>(
      `/gamification/challenges/${id}/leaderboard`,
      params as Record<string, unknown>
    ),
};

// Streaks
export interface MemberStreak {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export const streaksApi = {
  getLeaderboard: (params?: { limit?: number }) =>
    apiGet<MemberStreak[]>('/gamification/streaks/leaderboard', params as Record<string, unknown>),

  getMemberStreak: (memberId: string) =>
    apiGet<MemberStreak>(`/gamification/streaks/members/${memberId}`),
};
