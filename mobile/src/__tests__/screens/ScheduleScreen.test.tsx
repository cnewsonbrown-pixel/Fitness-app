import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ScheduleScreen } from '../../screens/member/ScheduleScreen';
import { memberService } from '../../services/member.service';
import { useMemberStore } from '../../store/member.store';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock services
jest.mock('../../services/member.service', () => ({
  memberService: {
    getSchedule: jest.fn(),
    createBooking: jest.fn(),
  },
}));

jest.mock('../../store/member.store', () => ({
  useMemberStore: jest.fn(),
}));

const mockedMemberService = memberService as jest.Mocked<typeof memberService>;
const mockedUseMemberStore = useMemberStore as jest.MockedFunction<typeof useMemberStore>;

describe('ScheduleScreen', () => {
  const mockClasses = [
    {
      id: 'class-1',
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T10:00:00Z',
      classType: { id: '1', name: 'Yoga Flow', duration: 60, color: '#6366f1' },
      location: { id: '1', name: 'Main Studio' },
      instructor: { id: '1', firstName: 'Jane', lastName: 'Smith' },
      capacity: 20,
      bookedCount: 15,
      waitlistCount: 0,
      status: 'SCHEDULED',
      isCancelled: false,
    },
    {
      id: 'class-2',
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T11:30:00Z',
      classType: { id: '2', name: 'HIIT', duration: 60, color: '#ef4444' },
      location: { id: '1', name: 'Main Studio' },
      instructor: { id: '2', firstName: 'John', lastName: 'Doe' },
      capacity: 15,
      bookedCount: 15,
      waitlistCount: 3,
      status: 'SCHEDULED',
      isCancelled: false,
    },
  ];

  const mockFetchUpcomingBookings = jest.fn();
  const mockCreateBooking = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedMemberService.getSchedule.mockResolvedValue(mockClasses);
    mockedMemberService.createBooking.mockResolvedValue({
      id: 'booking-1',
      status: 'CONFIRMED',
      isWaitlisted: false,
      createdAt: new Date().toISOString(),
      classSession: mockClasses[0],
    });

    mockedUseMemberStore.mockReturnValue({
      fetchUpcomingBookings: mockFetchUpcomingBookings,
      createBooking: mockCreateBooking,
    } as any);
  });

  describe('rendering', () => {
    it('should render schedule header', () => {
      const { getByText } = render(<ScheduleScreen />);

      expect(getByText('Schedule')).toBeTruthy();
    });

    it('should render week selector', () => {
      const { getByTestId } = render(<ScheduleScreen />);

      expect(getByTestId('week-selector')).toBeTruthy();
    });

    it('should render day tabs', () => {
      const { getAllByTestId } = render(<ScheduleScreen />);

      const dayTabs = getAllByTestId(/day-tab-/);
      expect(dayTabs.length).toBe(7);
    });
  });

  describe('data loading', () => {
    it('should fetch schedule on mount', async () => {
      render(<ScheduleScreen />);

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalled();
      });
    });

    it('should fetch schedule when date changes', async () => {
      const { getByTestId } = render(<ScheduleScreen />);

      // Click on different day
      fireEvent.press(getByTestId('day-tab-2'));

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('class list', () => {
    it('should display class cards', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
        expect(getByText('HIIT')).toBeTruthy();
      });
    });

    it('should show class time', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('9:00 AM')).toBeTruthy();
      });
    });

    it('should show instructor name', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText(/Jane Smith/)).toBeTruthy();
      });
    });

    it('should show spots available', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('5 spots left')).toBeTruthy();
      });
    });

    it('should show waitlist status for full classes', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Waitlist (3)')).toBeTruthy();
      });
    });
  });

  describe('booking', () => {
    it('should book class on button press', async () => {
      mockCreateBooking.mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
      });

      const { getByText, getAllByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
      });

      const bookButtons = getAllByText('Book');
      fireEvent.press(bookButtons[0]);

      await waitFor(() => {
        expect(mockCreateBooking).toHaveBeenCalledWith('class-1');
      });
    });

    it('should show success message after booking', async () => {
      mockCreateBooking.mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
      });

      const { getByText, getAllByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
      });

      fireEvent.press(getAllByText('Book')[0]);

      await waitFor(() => {
        expect(getByText('Booking confirmed!')).toBeTruthy();
      });
    });

    it('should show waitlist option for full class', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Join Waitlist')).toBeTruthy();
      });
    });

    it('should handle booking error', async () => {
      mockCreateBooking.mockRejectedValue(new Error('Class is full'));

      const { getByText, getAllByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
      });

      fireEvent.press(getAllByText('Book')[0]);

      await waitFor(() => {
        expect(getByText('Class is full')).toBeTruthy();
      });
    });
  });

  describe('filtering', () => {
    it('should filter by location', async () => {
      const { getByTestId, getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
      });

      fireEvent.press(getByTestId('filter-button'));
      fireEvent.press(getByText('Downtown Studio'));

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalledWith(
          expect.objectContaining({ locationId: 'downtown' })
        );
      });
    });

    it('should filter by class type', async () => {
      const { getByTestId, getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
      });

      fireEvent.press(getByTestId('filter-button'));
      fireEvent.press(getByText('Yoga'));

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalledWith(
          expect.objectContaining({ classTypeId: 'yoga' })
        );
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to class details on card press', async () => {
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('Yoga Flow')).toBeTruthy();
      });

      fireEvent.press(getByText('Yoga Flow'));

      expect(mockNavigate).toHaveBeenCalledWith('ClassDetails', { classId: 'class-1' });
    });
  });

  describe('week navigation', () => {
    it('should navigate to next week', async () => {
      const { getByTestId } = render(<ScheduleScreen />);

      fireEvent.press(getByTestId('next-week-button'));

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalled();
      });
    });

    it('should navigate to previous week', async () => {
      const { getByTestId } = render(<ScheduleScreen />);

      // First go forward, then back
      fireEvent.press(getByTestId('next-week-button'));
      fireEvent.press(getByTestId('prev-week-button'));

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalled();
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no classes', async () => {
      mockedMemberService.getSchedule.mockResolvedValue([]);

      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText('No classes scheduled')).toBeTruthy();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading indicator while fetching', () => {
      mockedMemberService.getSchedule.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockClasses), 1000))
      );

      const { getByTestId } = render(<ScheduleScreen />);

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('pull to refresh', () => {
    it('should refresh schedule on pull', async () => {
      const { getByTestId } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalledTimes(1);
      });

      fireEvent(getByTestId('schedule-list'), 'refresh');

      await waitFor(() => {
        expect(mockedMemberService.getSchedule).toHaveBeenCalledTimes(2);
      });
    });
  });
});
