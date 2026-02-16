import api from './api';

export interface PointTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  earnedAt?: string;
  progress?: number;
  requirement?: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'INDIVIDUAL' | 'TEAM';
  startDate: string;
  endDate: string;
  goal: number;
  currentProgress: number;
  unit: string;
  reward: {
    points: number;
    badge?: Badge;
  };
  isJoined: boolean;
  rank?: number;
  participants: number;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  avatarUrl?: string;
  points: number;
  isCurrentUser: boolean;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn?: string;
  streakStartDate?: string;
}

export interface GamificationSummary {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badgeCount: number;
  rank: number;
  totalMembers: number;
  recentAchievements: Badge[];
  activeChallenges: Challenge[];
}

export const gamificationService = {
  // Summary
  getSummary: async (): Promise<GamificationSummary> => {
    const response = await api.get('/gamification/summary');
    return response.data.data;
  },

  // Points
  getPointsBalance: async (): Promise<number> => {
    const response = await api.get('/gamification/points/balance');
    return response.data.data.balance;
  },

  getPointsHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: PointTransaction[]; total: number }> => {
    const response = await api.get('/gamification/points/history', { params });
    return response.data;
  },

  // Badges
  getAllBadges: async (): Promise<Badge[]> => {
    const response = await api.get('/gamification/badges');
    return response.data.data;
  },

  getEarnedBadges: async (): Promise<Badge[]> => {
    const response = await api.get('/gamification/badges/earned');
    return response.data.data;
  },

  // Challenges
  getActiveChallenges: async (): Promise<Challenge[]> => {
    const response = await api.get('/gamification/challenges/active');
    return response.data.data;
  },

  getChallenge: async (challengeId: string): Promise<Challenge> => {
    const response = await api.get(`/gamification/challenges/${challengeId}`);
    return response.data.data;
  },

  joinChallenge: async (challengeId: string): Promise<void> => {
    await api.post(`/gamification/challenges/${challengeId}/join`);
  },

  leaveChallenge: async (challengeId: string): Promise<void> => {
    await api.post(`/gamification/challenges/${challengeId}/leave`);
  },

  getChallengeLeaderboard: async (
    challengeId: string
  ): Promise<LeaderboardEntry[]> => {
    const response = await api.get(
      `/gamification/challenges/${challengeId}/leaderboard`
    );
    return response.data.data;
  },

  // Leaderboard
  getLeaderboard: async (params?: {
    period?: 'weekly' | 'monthly' | 'allTime';
    limit?: number;
  }): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/gamification/leaderboard', { params });
    return response.data.data;
  },

  // Streaks
  getStreak: async (): Promise<Streak> => {
    const response = await api.get('/gamification/streaks');
    return response.data.data;
  },

  checkIn: async (): Promise<{ streak: number; bonusPoints: number }> => {
    const response = await api.post('/gamification/streaks/check-in');
    return response.data.data;
  },
};
