import { create } from 'zustand';
import { Member, Membership, Booking, Badge, Challenge } from '../types';
import { memberService } from '../services/member.service';

interface MemberState {
  profile: Member | null;
  memberships: Membership[];
  upcomingBookings: Booking[];
  badges: Badge[];
  challenges: Challenge[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Member>) => Promise<void>;
  fetchMemberships: () => Promise<void>;
  fetchUpcomingBookings: () => Promise<void>;
  createBooking: (classSessionId: string) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  checkIn: (bookingId: string) => Promise<void>;
  checkInWithQR: (qrCode: string) => Promise<Booking>;
  fetchBadges: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  clearError: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  profile: null,
  memberships: [],
  upcomingBookings: [],
  badges: [],
  challenges: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const profile = await memberService.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to fetch profile',
      });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const profile = await memberService.updateProfile(data);
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to update profile',
      });
      throw error;
    }
  },

  fetchMemberships: async () => {
    try {
      set({ isLoading: true, error: null });
      const memberships = await memberService.getMemberships();
      set({ memberships, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to fetch memberships',
      });
    }
  },

  fetchUpcomingBookings: async () => {
    try {
      set({ isLoading: true, error: null });
      const upcomingBookings = await memberService.getUpcomingBookings();
      set({ upcomingBookings, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to fetch bookings',
      });
    }
  },

  createBooking: async (classSessionId) => {
    try {
      set({ isLoading: true, error: null });
      const booking = await memberService.createBooking(classSessionId);
      // Refresh bookings
      const upcomingBookings = await memberService.getUpcomingBookings();
      set({ upcomingBookings, isLoading: false });
      return booking;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to create booking',
      });
      throw error;
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      set({ isLoading: true, error: null });
      await memberService.cancelBooking(bookingId);
      // Refresh bookings
      const upcomingBookings = await memberService.getUpcomingBookings();
      set({ upcomingBookings, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to cancel booking',
      });
      throw error;
    }
  },

  checkIn: async (bookingId) => {
    try {
      set({ isLoading: true, error: null });
      await memberService.checkIn(bookingId);
      // Refresh bookings
      const upcomingBookings = await memberService.getUpcomingBookings();
      set({ upcomingBookings, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to check in',
      });
      throw error;
    }
  },

  checkInWithQR: async (qrCode) => {
    try {
      set({ isLoading: true, error: null });
      const booking = await memberService.checkInWithQR(qrCode);
      // Refresh bookings
      const upcomingBookings = await memberService.getUpcomingBookings();
      set({ upcomingBookings, isLoading: false });
      return booking;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to check in with QR',
      });
      throw error;
    }
  },

  fetchBadges: async () => {
    try {
      set({ isLoading: true, error: null });
      const badges = await memberService.getBadges();
      set({ badges, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to fetch badges',
      });
    }
  },

  fetchChallenges: async () => {
    try {
      set({ isLoading: true, error: null });
      const challenges = await memberService.getChallenges();
      set({ challenges, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to fetch challenges',
      });
    }
  },

  joinChallenge: async (challengeId) => {
    try {
      set({ isLoading: true, error: null });
      await memberService.joinChallenge(challengeId);
      // Refresh challenges
      const challenges = await memberService.getChallenges();
      set({ challenges, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to join challenge',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
