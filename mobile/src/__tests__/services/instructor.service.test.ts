import { instructorService } from '../../services/instructor.service';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import { apiGet, apiPost } from '../../services/api';

const mockedApiGet = apiGet as jest.Mock;
const mockedApiPost = apiPost as jest.Mock;

describe('Instructor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMySchedule', () => {
    it('should fetch instructor schedule for date range', async () => {
      const mockSchedule = [
        { id: '1', startTime: '2024-01-15T09:00:00Z' },
        { id: '2', startTime: '2024-01-15T14:00:00Z' },
      ];
      mockedApiGet.mockResolvedValue(mockSchedule);

      const result = await instructorService.getMySchedule({
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(mockedApiGet).toHaveBeenCalledWith('/staff/me/schedule', {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getTodaysClasses', () => {
    it('should fetch today\'s classes', async () => {
      const mockClasses = [{ id: '1' }];
      mockedApiGet.mockResolvedValue(mockClasses);

      const result = await instructorService.getTodaysClasses();

      expect(mockedApiGet).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getUpcomingClasses', () => {
    it('should fetch upcoming classes for default 7 days', async () => {
      const mockClasses = [{ id: '1' }, { id: '2' }];
      mockedApiGet.mockResolvedValue(mockClasses);

      const result = await instructorService.getUpcomingClasses();

      expect(mockedApiGet).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should fetch upcoming classes for custom days', async () => {
      const mockClasses = [{ id: '1' }];
      mockedApiGet.mockResolvedValue(mockClasses);

      const result = await instructorService.getUpcomingClasses(14);

      expect(mockedApiGet).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getClassRoster', () => {
    it('should fetch class roster', async () => {
      const mockRoster = [
        { id: '1', member: { firstName: 'John' }, status: 'CONFIRMED' },
        { id: '2', member: { firstName: 'Jane' }, status: 'CHECKED_IN' },
      ];
      mockedApiGet.mockResolvedValue(mockRoster);

      const result = await instructorService.getClassRoster('class-1');

      expect(mockedApiGet).toHaveBeenCalledWith('/classes/class-1/roster');
      expect(result).toHaveLength(2);
    });
  });

  describe('getClassWaitlist', () => {
    it('should fetch class waitlist', async () => {
      const mockWaitlist = [
        { id: '1', member: { firstName: 'Bob' }, waitlistPosition: 1 },
      ];
      mockedApiGet.mockResolvedValue(mockWaitlist);

      const result = await instructorService.getClassWaitlist('class-1');

      expect(mockedApiGet).toHaveBeenCalledWith('/classes/class-1/waitlist');
      expect(result).toHaveLength(1);
    });
  });

  describe('checkInMember', () => {
    it('should check in a member', async () => {
      const mockCheckedIn = { id: '1', status: 'CHECKED_IN' };
      mockedApiPost.mockResolvedValue(mockCheckedIn);

      const result = await instructorService.checkInMember('booking-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/bookings/booking-1/check-in');
      expect(result.status).toBe('CHECKED_IN');
    });
  });

  describe('markNoShow', () => {
    it('should mark member as no-show', async () => {
      const mockNoShow = { id: '1', status: 'NO_SHOW' };
      mockedApiPost.mockResolvedValue(mockNoShow);

      const result = await instructorService.markNoShow('booking-1');

      expect(mockedApiPost).toHaveBeenCalledWith('/bookings/booking-1/no-show');
      expect(result.status).toBe('NO_SHOW');
    });
  });

  describe('getMemberDetails', () => {
    it('should fetch member details', async () => {
      const mockMember = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      mockedApiGet.mockResolvedValue(mockMember);

      const result = await instructorService.getMemberDetails('member-1');

      expect(mockedApiGet).toHaveBeenCalledWith('/members/member-1');
      expect(result.firstName).toBe('John');
    });
  });

  describe('Substitute Requests', () => {
    describe('createSubRequest', () => {
      it('should create substitute request with reason', async () => {
        const mockRequest = { id: '1', status: 'PENDING', reason: 'Sick' };
        mockedApiPost.mockResolvedValue(mockRequest);

        const result = await instructorService.createSubRequest('class-1', 'Sick');

        expect(mockedApiPost).toHaveBeenCalledWith('/classes/class-1/substitute-request', {
          reason: 'Sick',
        });
        expect(result.status).toBe('PENDING');
      });

      it('should create substitute request without reason', async () => {
        const mockRequest = { id: '1', status: 'PENDING' };
        mockedApiPost.mockResolvedValue(mockRequest);

        const result = await instructorService.createSubRequest('class-1');

        expect(mockedApiPost).toHaveBeenCalledWith('/classes/class-1/substitute-request', {
          reason: undefined,
        });
      });
    });

    describe('getMySubRequests', () => {
      it('should fetch instructor\'s substitute requests', async () => {
        const mockRequests = [
          { id: '1', status: 'PENDING' },
          { id: '2', status: 'FILLED' },
        ];
        mockedApiGet.mockResolvedValue(mockRequests);

        const result = await instructorService.getMySubRequests();

        expect(mockedApiGet).toHaveBeenCalledWith('/staff/me/substitute-requests');
        expect(result).toHaveLength(2);
      });
    });

    describe('getAvailableSubRequests', () => {
      it('should fetch available substitute requests', async () => {
        const mockRequests = [{ id: '1', status: 'PENDING' }];
        mockedApiGet.mockResolvedValue(mockRequests);

        const result = await instructorService.getAvailableSubRequests();

        expect(mockedApiGet).toHaveBeenCalledWith('/staff/substitute-requests/available');
        expect(result).toHaveLength(1);
      });
    });

    describe('acceptSubRequest', () => {
      it('should accept a substitute request', async () => {
        const mockAccepted = { id: '1', status: 'ACCEPTED' };
        mockedApiPost.mockResolvedValue(mockAccepted);

        const result = await instructorService.acceptSubRequest('request-1');

        expect(mockedApiPost).toHaveBeenCalledWith(
          '/staff/substitute-requests/request-1/accept'
        );
        expect(result.status).toBe('ACCEPTED');
      });
    });

    describe('declineSubRequest', () => {
      it('should decline a substitute request', async () => {
        const mockDeclined = { id: '1', status: 'DECLINED' };
        mockedApiPost.mockResolvedValue(mockDeclined);

        const result = await instructorService.declineSubRequest('request-1');

        expect(mockedApiPost).toHaveBeenCalledWith(
          '/staff/substitute-requests/request-1/decline'
        );
        expect(result.status).toBe('DECLINED');
      });
    });

    describe('cancelSubRequest', () => {
      it('should cancel a substitute request', async () => {
        mockedApiPost.mockResolvedValue(undefined);

        await instructorService.cancelSubRequest('request-1');

        expect(mockedApiPost).toHaveBeenCalledWith(
          '/staff/substitute-requests/request-1/cancel'
        );
      });
    });
  });

  describe('Pay', () => {
    describe('getPaySummary', () => {
      it('should fetch pay summary', async () => {
        const mockSummary = {
          totalEarnings: 1500,
          classCount: 10,
          period: { start: '2024-01-01', end: '2024-01-31' },
          breakdown: [],
        };
        mockedApiGet.mockResolvedValue(mockSummary);

        const result = await instructorService.getPaySummary();

        expect(mockedApiGet).toHaveBeenCalledWith('/staff/me/pay-summary', undefined);
        expect(result.totalEarnings).toBe(1500);
      });

      it('should fetch pay summary with date range', async () => {
        const mockSummary = { totalEarnings: 500, classCount: 5 };
        mockedApiGet.mockResolvedValue(mockSummary);

        const params = { startDate: '2024-01-01', endDate: '2024-01-15' };
        await instructorService.getPaySummary(params);

        expect(mockedApiGet).toHaveBeenCalledWith('/staff/me/pay-summary', params);
      });
    });

    describe('getPayHistory', () => {
      it('should fetch pay history with pagination', async () => {
        const mockHistory = {
          data: [{ totalEarnings: 1500 }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        };
        mockedApiGet.mockResolvedValue(mockHistory);

        const result = await instructorService.getPayHistory({ page: 1, limit: 10 });

        expect(mockedApiGet).toHaveBeenCalledWith('/staff/me/pay-history', {
          page: 1,
          limit: 10,
        });
        expect(result.data).toHaveLength(1);
      });
    });
  });

  describe('Profile', () => {
    describe('getMyStaffProfile', () => {
      it('should fetch staff profile', async () => {
        const mockProfile = {
          id: '1',
          role: 'INSTRUCTOR',
          isInstructor: true,
        };
        mockedApiGet.mockResolvedValue(mockProfile);

        const result = await instructorService.getMyStaffProfile();

        expect(mockedApiGet).toHaveBeenCalledWith('/staff/me');
        expect(result.role).toBe('INSTRUCTOR');
      });
    });

    describe('updateAvailability', () => {
      it('should update availability', async () => {
        mockedApiPost.mockResolvedValue(undefined);

        const availability = [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', locationId: 'loc-1' },
        ];
        await instructorService.updateAvailability(availability);

        expect(mockedApiPost).toHaveBeenCalledWith('/staff/me/availability', {
          availability,
        });
      });
    });
  });
});
