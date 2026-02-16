export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const LIFECYCLE_STAGE_COLORS: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800',
  TRIAL: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  CHURNED: 'bg-red-100 text-red-800',
  PAUSED: 'bg-gray-100 text-gray-800',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  WAITLISTED: 'bg-yellow-100 text-yellow-800',
  CHECKED_IN: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export const CLASS_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const MEMBERSHIP_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  PENDING: 'bg-blue-100 text-blue-800',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};
