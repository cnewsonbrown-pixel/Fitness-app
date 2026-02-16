import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../screens/member/HomeScreen';
import { useMemberStore } from '../../store/member.store';
import { useAuthStore } from '../../store/auth.store';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock stores
jest.mock('../../store/member.store', () => ({
  useMemberStore: jest.fn(),
}));

jest.mock('../../store/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseMemberStore = useMemberStore as jest.MockedFunction<typeof useMemberStore>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('HomeScreen', () => {
  const mockFetchProfile = jest.fn();
  const mockFetchUpcomingBookings = jest.fn();

  const mockProfile = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    pointBalance: 500,
    currentStreak: 7,
    longestStreak: 14,
  };

  const mockUpcomingBookings = [
    {
      id: 'booking-1',
      status: 'CONFIRMED',
      classSession: {
        id: 'class-1',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(),
        classType: { name: 'Yoga Flow', color: '#6366f1' },
        location: { name: 'Main Studio' },
        instructor: { firstName: 'Jane', lastName: 'Smith' },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseMemberStore.mockReturnValue({
      profile: mockProfile,
      upcomingBookings: mockUpcomingBookings,
      fetchProfile: mockFetchProfile,
      fetchUpcomingBookings: mockFetchUpcomingBookings,
      isLoading: false,
    } as any);

    mockedUseAuthStore.mockReturnValue({
      user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    } as any);
  });

  describe('rendering', () => {
    it('should render welcome message with user name', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText(/Welcome, John/)).toBeTruthy();
    });

    it('should render stats cards', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('500')).toBeTruthy(); // Points
      expect(getByText('7')).toBeTruthy(); // Current streak
    });

    it('should render upcoming classes section', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Upcoming Classes')).toBeTruthy();
    });

    it('should render upcoming class card', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Yoga Flow')).toBeTruthy();
      expect(getByText('Main Studio')).toBeTruthy();
      expect(getByText(/Jane Smith/)).toBeTruthy();
    });

    it('should render quick actions', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Book Class')).toBeTruthy();
      expect(getByText('Check In')).toBeTruthy();
    });
  });

  describe('data fetching', () => {
    it('should fetch profile on mount', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockFetchProfile).toHaveBeenCalled();
      });
    });

    it('should fetch upcoming bookings on mount', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockFetchUpcomingBookings).toHaveBeenCalled();
      });
    });
  });

  describe('pull to refresh', () => {
    it('should refresh data on pull', async () => {
      const { getByTestId } = render(<HomeScreen />);

      const scrollView = getByTestId('home-scroll-view');

      // Simulate refresh
      fireEvent(scrollView, 'refresh');

      await waitFor(() => {
        expect(mockFetchProfile).toHaveBeenCalled();
        expect(mockFetchUpcomingBookings).toHaveBeenCalled();
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to schedule on "Book Class" press', () => {
      const { getByText } = render(<HomeScreen />);

      fireEvent.press(getByText('Book Class'));

      expect(mockNavigate).toHaveBeenCalledWith('Schedule');
    });

    it('should navigate to QR scanner on "Check In" press', () => {
      const { getByText } = render(<HomeScreen />);

      fireEvent.press(getByText('Check In'));

      expect(mockNavigate).toHaveBeenCalledWith('QRScanner');
    });

    it('should navigate to class details on class card press', () => {
      const { getByText } = render(<HomeScreen />);

      fireEvent.press(getByText('Yoga Flow'));

      expect(mockNavigate).toHaveBeenCalledWith('ClassDetails', { classId: 'class-1' });
    });

    it('should navigate to profile on avatar press', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('profile-avatar'));

      expect(mockNavigate).toHaveBeenCalledWith('Profile');
    });
  });

  describe('empty states', () => {
    it('should show empty state when no upcoming classes', () => {
      mockedUseMemberStore.mockReturnValue({
        profile: mockProfile,
        upcomingBookings: [],
        fetchProfile: mockFetchProfile,
        fetchUpcomingBookings: mockFetchUpcomingBookings,
        isLoading: false,
      } as any);

      const { getByText } = render(<HomeScreen />);

      expect(getByText('No upcoming classes')).toBeTruthy();
      expect(getByText('Book a class to get started')).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when fetching data', () => {
      mockedUseMemberStore.mockReturnValue({
        profile: null,
        upcomingBookings: [],
        fetchProfile: mockFetchProfile,
        fetchUpcomingBookings: mockFetchUpcomingBookings,
        isLoading: true,
      } as any);

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('streak display', () => {
    it('should show flame icon for active streak', () => {
      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('streak-icon')).toBeTruthy();
    });

    it('should show streak milestone badge', () => {
      mockedUseMemberStore.mockReturnValue({
        profile: { ...mockProfile, currentStreak: 30 },
        upcomingBookings: mockUpcomingBookings,
        fetchProfile: mockFetchProfile,
        fetchUpcomingBookings: mockFetchUpcomingBookings,
        isLoading: false,
      } as any);

      const { getByText } = render(<HomeScreen />);

      expect(getByText('30')).toBeTruthy();
    });
  });

  describe('points display', () => {
    it('should format large point balances', () => {
      mockedUseMemberStore.mockReturnValue({
        profile: { ...mockProfile, pointBalance: 1500 },
        upcomingBookings: mockUpcomingBookings,
        fetchProfile: mockFetchProfile,
        fetchUpcomingBookings: mockFetchUpcomingBookings,
        isLoading: false,
      } as any);

      const { getByText } = render(<HomeScreen />);

      expect(getByText('1,500')).toBeTruthy();
    });
  });

  describe('class time display', () => {
    it('should show relative time for upcoming class', () => {
      const { getByText } = render(<HomeScreen />);

      // Should show "in X minutes" or similar
      expect(getByText(/in \d+ (minutes?|hours?)/i)).toBeTruthy();
    });
  });
});
