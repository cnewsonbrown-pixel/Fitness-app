import { useMemberStore } from '../../store/member.store';
import { memberService } from '../../services/member.service';

// Mock services
jest.mock('../../services/member.service', () => ({
  memberService: {
    getProfile: jest.fn(),
    getMemberships: jest.fn(),
    getUpcomingBookings: jest.fn(),
    getBookings: jest.fn(),
    createBooking: jest.fn(),
    cancelBooking: jest.fn(),
    checkIn: jest.fn(),
    checkInWithQR: jest.fn(),
  },
}));

const mockedMemberService = memberService as jest.Mocked<typeof memberService>;

describe('Member Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useMemberStore.setState({
      profile: null,
      memberships: [],
      upcomingBookings: [],
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useMemberStore.getState();

      expect(state.profile).toBeNull();
      expect(state.memberships).toEqual([]);
      expect(state.upcomingBookings).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchProfile', () => {
    it('should fetch and store profile', async () => {
      const mockProfile = {
        id: '1',
        email: 'member@example.com',
        firstName: 'John',
        lastName: 'Doe',
        pointBalance: 500,
        currentStreak: 7,
        longestStreak: 14,
        lifecycleStage: 'ACTIVE' as const,
        tags: ['yoga', 'morning'],
      };

      mockedMemberService.getProfile.mockResolvedValue(mockProfile);

      await useMemberStore.getState().fetchProfile();

      const state = useMemberStore.getState();
      expect(state.profile).toEqual(mockProfile);
      expect(state.error).toBeNull();
    });

    it('should handle fetch profile error', async () => {
      mockedMemberService.getProfile.mockRejectedValue(new Error('Network error'));

      await useMemberStore.getState().fetchProfile();

      const state = useMemberStore.getState();
      expect(state.profile).toBeNull();
      expect(state.error).toBe('Network error');
    });

    it('should set loading state during fetch', async () => {
      mockedMemberService.getProfile.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const fetchPromise = useMemberStore.getState().fetchProfile();

      expect(useMemberStore.getState().isLoading).toBe(true);

      await fetchPromise;
    });
  });

  describe('fetchMemberships', () => {
    it('should fetch and store memberships', async () => {
      const mockMemberships = [
        {
          id: '1',
          status: 'ACTIVE' as const,
          membershipType: { id: '1', name: 'Premium', type: 'RECURRING' as const, price: 99 },
          startDate: '2024-01-01',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
        },
      ];

      mockedMemberService.getMemberships.mockResolvedValue(mockMemberships);

      await useMemberStore.getState().fetchMemberships();

      expect(useMemberStore.getState().memberships).toEqual(mockMemberships);
    });

    it('should handle fetch memberships error', async () => {
      mockedMemberService.getMemberships.mockRejectedValue(new Error('Failed to fetch'));

      await useMemberStore.getState().fetchMemberships();

      expect(useMemberStore.getState().memberships).toEqual([]);
      expect(useMemberStore.getState().error).toBe('Failed to fetch');
    });
  });

  describe('fetchUpcomingBookings', () => {
    it('should fetch and store upcoming bookings', async () => {
      const mockBookings = [
        {
          id: '1',
          status: 'CONFIRMED' as const,
          isWaitlisted: false,
          createdAt: '2024-01-15T10:00:00Z',
          classSession: {
            id: 'class-1',
            startTime: '2024-01-16T09:00:00Z',
            endTime: '2024-01-16T10:00:00Z',
            classType: { id: '1', name: 'Yoga', duration: 60, color: '#6366f1' },
            location: { id: '1', name: 'Main Studio', address: '123 Main St', city: 'NYC', country: 'USA', timezone: 'America/New_York', isActive: true },
            instructor: { id: '1', firstName: 'Jane', lastName: 'Smith' },
            capacity: 20,
            bookedCount: 15,
            waitlistCount: 0,
            status: 'SCHEDULED' as const,
            isCancelled: false,
          },
        },
      ];

      mockedMemberService.getUpcomingBookings.mockResolvedValue(mockBookings);

      await useMemberStore.getState().fetchUpcomingBookings();

      expect(useMemberStore.getState().upcomingBookings).toEqual(mockBookings);
    });
  });

  describe('createBooking', () => {
    it('should create booking and refresh list', async () => {
      const mockBooking = {
        id: 'new-booking',
        status: 'CONFIRMED' as const,
        isWaitlisted: false,
        createdAt: '2024-01-15T10:00:00Z',
        classSession: {
          id: 'class-1',
          startTime: '2024-01-16T09:00:00Z',
          endTime: '2024-01-16T10:00:00Z',
          classType: { id: '1', name: 'Yoga', duration: 60, color: '#6366f1' },
          location: { id: '1', name: 'Main Studio', address: '123 Main St', city: 'NYC', country: 'USA', timezone: 'America/New_York', isActive: true },
          instructor: { id: '1', firstName: 'Jane', lastName: 'Smith' },
          capacity: 20,
          bookedCount: 16,
          waitlistCount: 0,
          status: 'SCHEDULED' as const,
          isCancelled: false,
        },
      };

      mockedMemberService.createBooking.mockResolvedValue(mockBooking);
      mockedMemberService.getUpcomingBookings.mockResolvedValue([mockBooking]);

      const result = await useMemberStore.getState().createBooking('class-1');

      expect(mockedMemberService.createBooking).toHaveBeenCalledWith('class-1');
      expect(result).toEqual(mockBooking);
      expect(mockedMemberService.getUpcomingBookings).toHaveBeenCalled();
    });

    it('should handle waitlist booking', async () => {
      const mockBooking = {
        id: 'waitlist-booking',
        status: 'WAITLISTED' as const,
        isWaitlisted: true,
        waitlistPosition: 3,
        createdAt: '2024-01-15T10:00:00Z',
        classSession: {
          id: 'class-1',
          startTime: '2024-01-16T09:00:00Z',
          endTime: '2024-01-16T10:00:00Z',
          classType: { id: '1', name: 'Yoga', duration: 60, color: '#6366f1' },
          location: { id: '1', name: 'Main Studio', address: '123 Main St', city: 'NYC', country: 'USA', timezone: 'America/New_York', isActive: true },
          instructor: { id: '1', firstName: 'Jane', lastName: 'Smith' },
          capacity: 20,
          bookedCount: 20,
          waitlistCount: 3,
          status: 'SCHEDULED' as const,
          isCancelled: false,
        },
      };

      mockedMemberService.createBooking.mockResolvedValue(mockBooking);
      mockedMemberService.getUpcomingBookings.mockResolvedValue([mockBooking]);

      const result = await useMemberStore.getState().createBooking('class-1');

      expect(result.isWaitlisted).toBe(true);
      expect(result.waitlistPosition).toBe(3);
    });

    it('should handle booking error', async () => {
      mockedMemberService.createBooking.mockRejectedValue(new Error('Class is full'));

      await expect(useMemberStore.getState().createBooking('class-1')).rejects.toThrow(
        'Class is full'
      );
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and refresh list', async () => {
      const initialBookings = [
        {
          id: 'booking-1',
          status: 'CONFIRMED' as const,
          isWaitlisted: false,
          createdAt: '2024-01-15T10:00:00Z',
          classSession: {} as any,
        },
      ];

      useMemberStore.setState({ upcomingBookings: initialBookings });

      mockedMemberService.cancelBooking.mockResolvedValue(undefined);
      mockedMemberService.getUpcomingBookings.mockResolvedValue([]);

      await useMemberStore.getState().cancelBooking('booking-1');

      expect(mockedMemberService.cancelBooking).toHaveBeenCalledWith('booking-1');
      expect(mockedMemberService.getUpcomingBookings).toHaveBeenCalled();
      expect(useMemberStore.getState().upcomingBookings).toEqual([]);
    });
  });

  describe('checkIn', () => {
    it('should check in and update booking status', async () => {
      const mockCheckedIn = {
        id: 'booking-1',
        status: 'CHECKED_IN' as const,
        isWaitlisted: false,
        checkedInAt: '2024-01-16T09:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
        classSession: {} as any,
      };

      mockedMemberService.checkIn.mockResolvedValue(mockCheckedIn);
      mockedMemberService.getUpcomingBookings.mockResolvedValue([mockCheckedIn]);

      const result = await useMemberStore.getState().checkIn('booking-1');

      expect(result.status).toBe('CHECKED_IN');
      expect(result.checkedInAt).toBeDefined();
    });
  });

  describe('checkInWithQR', () => {
    it('should check in with QR code', async () => {
      const mockCheckedIn = {
        id: 'booking-1',
        status: 'CHECKED_IN' as const,
        isWaitlisted: false,
        checkedInAt: '2024-01-16T09:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
        classSession: {} as any,
      };

      mockedMemberService.checkInWithQR.mockResolvedValue(mockCheckedIn);
      mockedMemberService.getUpcomingBookings.mockResolvedValue([mockCheckedIn]);

      const result = await useMemberStore.getState().checkInWithQR('qr-code-data');

      expect(mockedMemberService.checkInWithQR).toHaveBeenCalledWith('qr-code-data');
      expect(result.status).toBe('CHECKED_IN');
    });

    it('should handle invalid QR code', async () => {
      mockedMemberService.checkInWithQR.mockRejectedValue(new Error('Invalid QR code'));

      await expect(
        useMemberStore.getState().checkInWithQR('invalid-qr')
      ).rejects.toThrow('Invalid QR code');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useMemberStore.setState({ error: 'Some error' });

      useMemberStore.getState().clearError();

      expect(useMemberStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useMemberStore.setState({
        profile: { id: '1' } as any,
        memberships: [{}] as any,
        upcomingBookings: [{}] as any,
        error: 'Some error',
      });

      useMemberStore.getState().reset();

      const state = useMemberStore.getState();
      expect(state.profile).toBeNull();
      expect(state.memberships).toEqual([]);
      expect(state.upcomingBookings).toEqual([]);
      expect(state.error).toBeNull();
    });
  });
});
