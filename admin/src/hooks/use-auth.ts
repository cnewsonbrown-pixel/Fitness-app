'use client';

import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const { user, tenant, staff, isAuthenticated, isLoading, error } = useAuthStore();

  return {
    user,
    tenant,
    staff,
    isAuthenticated,
    isLoading,
    error,
    role: staff?.role ?? undefined,
    isOwner: staff?.role === 'OWNER',
    isAdmin: staff?.role === 'ADMIN' || staff?.role === 'OWNER',
    isManager: staff?.role === 'MANAGER' || staff?.role === 'ADMIN' || staff?.role === 'OWNER',
  };
}
