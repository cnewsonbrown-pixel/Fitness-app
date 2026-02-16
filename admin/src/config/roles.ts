import { StaffRole } from '@/types';

export const ROLE_HIERARCHY: Record<StaffRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  INSTRUCTOR: 2,
  FRONT_DESK: 1,
};

export function hasRole(userRole: StaffRole | undefined, requiredRoles: StaffRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function hasMinimumRole(userRole: StaffRole | undefined, minimumRole: StaffRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  INSTRUCTOR: 'Instructor',
  FRONT_DESK: 'Front Desk',
};
