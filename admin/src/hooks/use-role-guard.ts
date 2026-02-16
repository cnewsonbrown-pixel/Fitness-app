'use client';

import { StaffRole } from '@/types';
import { useAuth } from './use-auth';
import { hasRole, hasMinimumRole } from '@/config/roles';

export function useRoleGuard() {
  const { role } = useAuth();

  return {
    role,
    hasRole: (requiredRoles: StaffRole[]) => hasRole(role, requiredRoles),
    hasMinimumRole: (minimumRole: StaffRole) => hasMinimumRole(role, minimumRole),
    isOwner: role === 'OWNER',
    isAdmin: role === 'OWNER' || role === 'ADMIN',
    isManager: role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER',
    isInstructor: role === 'INSTRUCTOR',
    isFrontDesk: role === 'FRONT_DESK',
  };
}
