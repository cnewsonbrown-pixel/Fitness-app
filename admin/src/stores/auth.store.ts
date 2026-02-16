import { create } from 'zustand';
import { User, Tenant, Staff } from '@/types';
import { authApi } from '@/lib/api/auth.api';
import { tokenStorage } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  staff: Staff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTenant: (tenant: Tenant) => void;
  setStaff: (staff: Staff) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  staff: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });

      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      const user = await authApi.getMe();
      let tenant: Tenant | null = null;
      try {
        tenant = await authApi.getCurrentTenant();
      } catch {
        // No tenant yet
      }

      set({
        user,
        tenant,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      tokenStorage.clearTokens();
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

      const response = await authApi.login({ email, password });
      let tenant: Tenant | null = null;
      try {
        tenant = await authApi.getCurrentTenant();
      } catch {
        // No tenant
      }

      set({
        user: response.user,
        tenant,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Login failed';
      set({
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authApi.logout();
    } finally {
      set({
        user: null,
        tenant: null,
        staff: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setTenant: (tenant: Tenant) => set({ tenant }),
  setStaff: (staff: Staff) => set({ staff }),
  clearError: () => set({ error: null }),
}));
