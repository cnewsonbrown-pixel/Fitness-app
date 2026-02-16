import { gamificationService } from '../../services/gamification.service';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../../services/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('Gamification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should fetch gamification summary', async () => {
      const mockSummary = {
        totalPoints: 500,
        currentStreak: 7,
        longestStreak: 14,
        badgeCount: 5,
        rank: 12,
        totalMembers: 100,
        recentAchievements: [],
        activeChallenges: [],
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockSummary } });

      const result = await gamificationService.getSummary();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/summary');
      expect(result.totalPoints).toBe(500);
      expect(result.currentStreak).toBe(7);
    });
  });

  describe('getPointsBalance', () => {
    it('should fetch points balance', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: { balance: 1250 } } });

      const result = await gamificationService.getPointsBalance();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/points/balance');
      expect(result).toBe(1250);
    });
  });

  describe('getPointsHistory', () => {
    it('should fetch points history with pagination', async () => {
      const mockHistory = {
        data: [
          { id: '1', points: 10, type: 'attendance', description: 'Class attended' },
          { id: '2', points: 5, type: 'streak', description: 'Streak bonus' },
        ],
        total: 2,
      };
      mockedApi.get.mockResolvedValue({ data: mockHistory });

      const result = await gamificationService.getPointsHistory({ page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/points/history', {
        params: { page: 1, limit: 10 },
      });
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getAllBadges', () => {
    it('should fetch all badges', async () => {
      const mockBadges = [
        { id: '1', name: 'First Class', category: 'Attendance' },
        { id: '2', name: 'Streak Master', category: 'Streaks' },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockBadges } });

      const result = await gamificationService.getAllBadges();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/badges');
      expect(result).toHaveLength(2);
    });
  });

  describe('getEarnedBadges', () => {
    it('should fetch earned badges', async () => {
      const mockBadges = [
        { id: '1', name: 'First Class', earnedAt: '2024-01-01' },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockBadges } });

      const result = await gamificationService.getEarnedBadges();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/badges/earned');
      expect(result).toHaveLength(1);
    });
  });

  describe('getActiveChallenges', () => {
    it('should fetch active challenges', async () => {
      const mockChallenges = [
        {
          id: '1',
          name: 'January Challenge',
          type: 'INDIVIDUAL',
          goal: 10,
          currentProgress: 5,
        },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockChallenges } });

      const result = await gamificationService.getActiveChallenges();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/challenges/active');
      expect(result).toHaveLength(1);
    });
  });

  describe('getChallenge', () => {
    it('should fetch challenge by id', async () => {
      const mockChallenge = {
        id: '1',
        name: 'January Challenge',
        description: 'Attend 10 classes',
        type: 'INDIVIDUAL',
        goal: 10,
        currentProgress: 5,
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockChallenge } });

      const result = await gamificationService.getChallenge('challenge-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/challenges/challenge-1');
      expect(result.name).toBe('January Challenge');
    });
  });

  describe('joinChallenge', () => {
    it('should join a challenge', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await gamificationService.joinChallenge('challenge-1');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/gamification/challenges/challenge-1/join'
      );
    });
  });

  describe('leaveChallenge', () => {
    it('should leave a challenge', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await gamificationService.leaveChallenge('challenge-1');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/gamification/challenges/challenge-1/leave'
      );
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should fetch challenge leaderboard', async () => {
      const mockLeaderboard = [
        { rank: 1, memberId: '1', memberName: 'John', points: 100 },
        { rank: 2, memberId: '2', memberName: 'Jane', points: 90 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockLeaderboard } });

      const result = await gamificationService.getChallengeLeaderboard('challenge-1');

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/gamification/challenges/challenge-1/leaderboard'
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch global leaderboard', async () => {
      const mockLeaderboard = [
        { rank: 1, memberId: '1', memberName: 'John', points: 1000 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockLeaderboard } });

      const result = await gamificationService.getLeaderboard({ period: 'weekly' });

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/leaderboard', {
        params: { period: 'weekly' },
      });
      expect(result).toHaveLength(1);
    });

    it('should fetch leaderboard with default params', async () => {
      const mockLeaderboard = [];
      mockedApi.get.mockResolvedValue({ data: { data: mockLeaderboard } });

      await gamificationService.getLeaderboard();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/leaderboard', {
        params: undefined,
      });
    });
  });

  describe('getStreak', () => {
    it('should fetch streak data', async () => {
      const mockStreak = {
        currentStreak: 7,
        longestStreak: 21,
        lastCheckIn: '2024-01-15',
        streakStartDate: '2024-01-09',
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockStreak } });

      const result = await gamificationService.getStreak();

      expect(mockedApi.get).toHaveBeenCalledWith('/gamification/streaks');
      expect(result.currentStreak).toBe(7);
    });
  });

  describe('checkIn', () => {
    it('should perform daily check-in', async () => {
      const mockResult = { streak: 8, bonusPoints: 10 };
      mockedApi.post.mockResolvedValue({ data: { data: mockResult } });

      const result = await gamificationService.checkIn();

      expect(mockedApi.post).toHaveBeenCalledWith('/gamification/streaks/check-in');
      expect(result.streak).toBe(8);
      expect(result.bonusPoints).toBe(10);
    });
  });
});
