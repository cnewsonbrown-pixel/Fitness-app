import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { PaginatedResponse } from '@/types';

// Custom Dashboard
export interface CustomDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'METRIC' | 'LINE_CHART' | 'BAR_CHART' | 'PIE_CHART' | 'TABLE' | 'HEATMAP';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetConfig {
  metric?: string;
  dimensions?: string[];
  filters?: Record<string, unknown>;
  dateRange?: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';
  customDateRange?: { startDate: string; endDate: string };
  comparison?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' | 'NONE';
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  groupBy?: string;
  limit?: number;
}

export interface WidgetData {
  value?: number | string;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  data?: Record<string, unknown>[];
  labels?: string[];
  series?: { name: string; data: number[] }[];
}

// Custom Reports
export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  config: ReportConfig;
  schedule?: ReportSchedule;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportConfig {
  metrics: string[];
  dimensions: string[];
  filters?: Record<string, unknown>;
  dateRange: 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'LAST_YEAR' | 'CUSTOM';
  customDateRange?: { startDate: string; endDate: string };
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
}

export interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: 'CSV' | 'PDF' | 'EXCEL';
}

export interface ReportResult {
  columns: { key: string; label: string; type: 'string' | 'number' | 'date' | 'currency' }[];
  rows: Record<string, unknown>[];
  summary?: Record<string, number>;
  generatedAt: string;
}

// Available Metrics and Dimensions
export interface MetricDefinition {
  key: string;
  label: string;
  category: string;
  type: 'number' | 'currency' | 'percentage';
  description?: string;
}

export interface DimensionDefinition {
  key: string;
  label: string;
  category: string;
  type: 'string' | 'date' | 'boolean';
  values?: { value: string; label: string }[];
}

export interface CreateDashboardData {
  name: string;
  description?: string;
  widgets?: DashboardWidget[];
  isDefault?: boolean;
}

export interface CreateReportData {
  name: string;
  description?: string;
  config: ReportConfig;
  schedule?: ReportSchedule;
}

export const customDashboardsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<CustomDashboard>>('/custom-analytics/dashboards', params as Record<string, unknown>),

  get: (id: string) => apiGet<CustomDashboard>(`/custom-analytics/dashboards/${id}`),

  create: (data: CreateDashboardData) =>
    apiPost<CustomDashboard>('/custom-analytics/dashboards', data),

  update: (id: string, data: Partial<CreateDashboardData>) =>
    apiPut<CustomDashboard>(`/custom-analytics/dashboards/${id}`, data),

  delete: (id: string) => apiDelete(`/custom-analytics/dashboards/${id}`),

  setDefault: (id: string) =>
    apiPost<CustomDashboard>(`/custom-analytics/dashboards/${id}/set-default`),

  addWidget: (id: string, widget: Omit<DashboardWidget, 'id'>) =>
    apiPost<CustomDashboard>(`/custom-analytics/dashboards/${id}/widgets`, widget),

  updateWidget: (dashboardId: string, widgetId: string, data: Partial<DashboardWidget>) =>
    apiPut<CustomDashboard>(`/custom-analytics/dashboards/${dashboardId}/widgets/${widgetId}`, data),

  removeWidget: (dashboardId: string, widgetId: string) =>
    apiDelete(`/custom-analytics/dashboards/${dashboardId}/widgets/${widgetId}`),

  resolveWidget: (dashboardId: string, widgetId: string) =>
    apiGet<WidgetData>(`/custom-analytics/dashboards/${dashboardId}/widgets/${widgetId}/resolve`),
};

export const customReportsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedResponse<CustomReport>>('/custom-analytics/reports', params as Record<string, unknown>),

  get: (id: string) => apiGet<CustomReport>(`/custom-analytics/reports/${id}`),

  create: (data: CreateReportData) =>
    apiPost<CustomReport>('/custom-analytics/reports', data),

  update: (id: string, data: Partial<CreateReportData>) =>
    apiPut<CustomReport>(`/custom-analytics/reports/${id}`, data),

  delete: (id: string) => apiDelete(`/custom-analytics/reports/${id}`),

  run: (id: string, params?: { startDate?: string; endDate?: string }) =>
    apiPost<ReportResult>(`/custom-analytics/reports/${id}/run`, params),

  export: (id: string, format: 'CSV' | 'PDF' | 'EXCEL') =>
    apiPost<{ downloadUrl: string }>(`/custom-analytics/reports/${id}/export`, { format }),

  schedule: (id: string, schedule: ReportSchedule) =>
    apiPost<CustomReport>(`/custom-analytics/reports/${id}/schedule`, schedule),

  unschedule: (id: string) =>
    apiDelete(`/custom-analytics/reports/${id}/schedule`),
};

export const analyticsMetadataApi = {
  getMetrics: () => apiGet<MetricDefinition[]>('/custom-analytics/metadata/metrics'),

  getDimensions: () => apiGet<DimensionDefinition[]>('/custom-analytics/metadata/dimensions'),

  previewQuery: (config: ReportConfig) =>
    apiPost<ReportResult>('/custom-analytics/preview', config),
};
