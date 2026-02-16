'use client';

import { StaffRole } from '@/types';
import { useRoleGuard } from '@/hooks/use-role-guard';

interface RoleGuardProps {
  roles: StaffRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { hasRole } = useRoleGuard();

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
