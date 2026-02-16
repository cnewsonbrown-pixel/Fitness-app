import { create } from 'zustand';
import { User, AuthTokens, Tenant } from '../types';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../services/api';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  setTenant: (tenant: Tenant) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });

      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      // Try to get current user
      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      // Token invalid, clear it
      await tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.login({ email, password });

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Login failed',
      });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.register(data);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } finally {
      set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setTenant: (tenant: Tenant) => {
    set({ tenant });
  },

  clearError: () => {
    set({ error: null });
  },
}));
