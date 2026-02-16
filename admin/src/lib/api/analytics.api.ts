import { apiGet, apiPost } from './client';

// Dashboard KPIs
export interface DashboardKPIs {
  totalMembers: number;
  membersGrowth: number;
  activeMembers: number;
  activeMembersGrowth: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  classAttendance: number;
  attendanceGrowth: number;
  averageRetention: number;
  retentionGrowth: number;
  newSignups: number;
  signupsGrowth: number;
}

// Popular Times
export interface PopularTimesData {
  dayOfWeek: number;
  hour: number;
  averageAttendance: number;
  maxAttendance: number;
}

export interface PopularTimesParams {
  locationId?: string;
  classTypeId?: string;
  startDate?: string;
  endDate?: string;
}

// Retention
export interface RetentionCohort {
  cohortMonth: string;
  initialCount: number;
  retainedCounts: number[];
  retentionRates: number[];
}

export interface RetentionParams {
  cohortCount?: number;
  startDate?: string;
}

// Reports
export interface MemberActivityReport {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembers: number;
  churnedMembers: number;
  membersByStatus: { status: string; count: number }[];
  activityTrend: { date: string; active: number; inactive: number }[];
}

export interface RevenueReport {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  refunds: number;
  netRevenue: number;
  revenueBySource: { source: string; revenue: number }[];
  revenueTrend: { date: string; revenue: number }[];
  topMemberships: { name: string; revenue: number; subscribers: number }[];
}

export interface AttendanceReport {
  totalClasses: number;
  totalAttendees: number;
  averageAttendance: number;
  fillRate: number;
  noShowRate: number;
  attendanceByClassType: { classType: string; attendance: number; fillRate: number }[];
  attendanceByDay: { dayOfWeek: number; attendance: number }[];
  attendanceTrend: { date: string; attendance: number }[];
}

export interface InstructorPayReport {
  totalPay: number;
  totalHours: number;
  averageHourlyRate: number;
  instructorPay: {
    instructorId: string;
    instructorName: string;
    hours: number;
    classes: number;
    pay: number;
    hourlyRate: number;
  }[];
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  locationId?: string;
}

export const analyticsApi = {
  // Dashboard
  getDashboardKPIs: (params?: { locationId?: string }) =>
    apiGet<DashboardKPIs>('/analytics/dashboard', params as Record<string, unknown>),

  // Popular Times (heatmap)
  getPopularTimes: (params?: PopularTimesParams) =>
    apiGet<PopularTimesData[]>('/analytics/popular-times', params as Record<string, unknown>),

  // Retention (cohort analysis)
  getRetentionCohorts: (params?: RetentionParams) =>
    apiGet<RetentionCohort[]>('/analytics/retention', params as Record<string, unknown>),

  // Reports
  getMemberActivityReport: (params?: ReportParams) =>
    apiGet<MemberActivityReport>('/analytics/reports/member-activity', params as Record<string, unknown>),

  getRevenueReport: (params?: ReportParams) =>
    apiGet<RevenueReport>('/analytics/reports/revenue', params as Record<string, unknown>),

  getAttendanceReport: (params?: ReportParams) =>
    apiGet<AttendanceReport>('/analytics/reports/attendance', params as Record<string, unknown>),

  getInstructorPayReport: (params?: ReportParams) =>
    apiGet<InstructorPayReport>('/analytics/reports/instructor-pay', params as Record<string, unknown>),

  // Export
  exportReport: (reportType: string, format: 'csv' | 'pdf', params?: ReportParams) =>
    apiPost<{ downloadUrl: string }>(`/analytics/reports/${reportType}/export`, {
      format,
      ...params,
    }),
};
