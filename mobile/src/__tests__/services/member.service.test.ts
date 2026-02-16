import { memberService } from '../../services/member.service';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
}));

import { apiGet, apiPost, apiPatch } from '../../services/api';

const mockedApiGet = apiGet as jest.Mock;
const mockedApiPost = apiPost as jest.Mock;
const mockedApiPatch = apiPatch as jest.Mock;

describe('Member Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch member profile', async () => {
      const mockProfile = {
        id: '1',
        email: 'member@example.com',
        firstName: 'John',
        lastName: 'Doe',
        pointBalance: 100,
        currentStreak: 5,
      };
      mockedApiGet.mockResolvedValue(mockProfile);

      const result = await memberService.getProfile();

      expect(mockedApiGet).toHaveBeenCalledWith('/members/me');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update member profile', async () => {
      const updateData = { firstName: 'Jane' };
      const mockUpdated = { id: '1', firstName: 'Jane', lastName: 'Doe' };
      mockedApiPatch.mockResolvedValue(mockUpdated);

      const result = await memberService.updateProfile(updateData);

      expect(mockedApiPatch).toHaveBeenCalledWith('/members/me', updateData);
      expect(result.firstName).toBe('Jane');
    });
  });

  describe('getMemberships', () => {
    it('should fetch member memberships', async () => {
      const mockMemberships = [
        { id: '1', status: 'ACTIVE', membershipType: { name: 'Premium' } },
        { id: '2', status: 'CANCELLED', membershipType: { name: 'Basic' } },
      ];
      mockedApiGet.mockResolvedValue(mockMemberships);

      const result = await memberService.getMemberships();

      expect(mockedApiGet).toHaveBeenCalledWith('/memberships/me');
      expect(result).toHaveLength(2);
    });
  });

  describe('pauseMembership', () => {
    it('should pause membership with end date', async () => {
      const mockPaused = { id: '1', status: 'PAUSED', pausedAt: '2024-01-15' };
      mockedApiPost.mockResolvedValue(mockPaused);

      const result = await memberService.pauseMembership('1', '2024-02-15');

      expect(mockedApiPost).toHaveBeenCalledWith('/memberships/1/pause', {
        pauseEndDate: '2024-02-15',
      });
      expect(result.status).toBe('PAUSED');
    });
  });

  describe('resumeMembership', () => {
    it('should resume paused membership', async () => {
      const mockResumed = { id: '1', status: 'ACTIVE' };
      mockedApiPost.mockResolvedValue(mockResumed);

      const result = await memberService.resumeMembership('1');

      expect(mockedApiPost).toHaveBeenCalledWith('/memberships/1/resume');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('getBookings', () => {
    it('should fetch member bookings with filters', async () => {
      const mockBookings = [
        { id: '1', status: 'CONFIRMED' },
        { id: '2', status: 'CHECKED_IN' },
      ];
      mockedApiGet.mockResolvedValue(mockBookings);

      const params = { status: 'CONFIRMED', startDate: '2024-01-01' };
      const result = await memberService.getBookings(params);

      expect(mockedApiGet).toHaveBeenCalledWith('/bookings/me', params);
      expect(result).toHaveLength(2);
    });
  });

  describe('getUpcomingBookings', () => {
    it('should fetch upcoming bookings', async () => {
      const mockBookings = [{ id: '1', status: 'CONFIRMED' }];
      mockedApiGet.mockResolvedValue(mockBookings);

      const result = await memberService.getUpcomingBookings();

      expect(mockedApiGet).toHaveBeenCalledWith('/bookings/me/upcoming');
      expect(result).toHaveLength(1);
    });
  });

  describe('createBooking', () => {
    it('should create a new booking', async () => {
      const mockBooking = {
        id: '1',
        classSession: { id: 'class-1' },
        status: 'CONFIRMED',
      };
      mockedApiPost.mockResolvedValue(mockBooking);

      const result = await memberService.createBooking('class-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/bookings', {
        classSessionId: 'class-1',
      });
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await memberService.cancelBooking('booking-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/bookings/booking-1/cancel');
    });
  });

  describe('checkIn', () => {
    it('should check in to a booking', async () => {
      const mockCheckedIn = { id: '1', status: 'CHECKED_IN' };
      mockedApiPost.mockResolvedValue(mockCheckedIn);

      const result = await memberService.checkIn('booking-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/bookings/booking-1/check-in');
      expect(result.status).toBe('CHECKED_IN');
    });
  });

  describe('checkInWithQR', () => {
    it('should check in with QR code', async () => {
      const mockCheckedIn = { id: '1', status: 'CHECKED_IN' };
      mockedApiPost.mockResolvedValue(mockCheckedIn);

      const result = await memberService.checkInWithQR('qr-code-data');

      expect(mockedApiPost).toHaveBeenCalledWith('/bookings/check-in/qr', {
        qrCode: 'qr-code-data',
      });
      expect(result.status).toBe('CHECKED_IN');
    });
  });

  describe('getSchedule', () => {
    it('should fetch class schedule with filters', async () => {
      const mockClasses = [
        { id: '1', startTime: '2024-01-15T09:00:00Z' },
        { id: '2', startTime: '2024-01-15T10:00:00Z' },
      ];
      mockedApiGet.mockResolvedValue(mockClasses);

      const params = {
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        locationId: 'loc-1',
      };
      const result = await memberService.getSchedule(params);

      expect(mockedApiGet).toHaveBeenCalledWith('/classes', params);
      expect(result).toHaveLength(2);
    });
  });

  describe('getBadges', () => {
    it('should fetch earned badges', async () => {
      const mockBadges = [
        { id: '1', name: 'First Class', earnedAt: '2024-01-01' },
        { id: '2', name: 'Streak Master', earnedAt: '2024-01-10' },
      ];
      mockedApiGet.mockResolvedValue(mockBadges);

      const result = await memberService.getBadges();

      expect(mockedApiGet).toHaveBeenCalledWith('/gamification/badges/me');
      expect(result).toHaveLength(2);
    });
  });

  describe('joinChallenge', () => {
    it('should join a challenge', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await memberService.joinChallenge('challenge-1');

      expect(mockedApiPost).toHaveBeenCalledWith(
        '/gamification/challenges/challenge-1/join'
      );
    });
  });

  describe('getArticles', () => {
    it('should fetch articles with pagination', async () => {
      const mockArticles = {
        data: [{ id: '1', title: 'Test Article' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      mockedApiGet.mockResolvedValue(mockArticles);

      const result = await memberService.getArticles({ category: 'Fitness', page: 1 });

      expect(mockedApiGet).toHaveBeenCalledWith('/content/articles', {
        category: 'Fitness',
        page: 1,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('bookmarkArticle', () => {
    it('should bookmark an article', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await memberService.bookmarkArticle('article-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/content/articles/article-1/bookmark');
    });
  });

  describe('unbookmarkArticle', () => {
    it('should remove bookmark from article', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await memberService.unbookmarkArticle('article-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/content/articles/article-1/unbookmark');
    });
  });

  describe('updateVideoProgress', () => {
    it('should update video progress', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await memberService.updateVideoProgress('video-1', 120);

      expect(mockedApiPost).toHaveBeenCalledWith('/video/video-1/progress', {
        watchedSeconds: 120,
      });
    });
  });

  describe('markVideoComplete', () => {
    it('should mark video as complete', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await memberService.markVideoComplete('video-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/video/video-1/complete');
    });
  });
});
