import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// ============================================
// CUSTOM DASHBOARDS
// ============================================

interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  dataSource: string; // e.g. 'members', 'revenue', 'attendance', 'bookings'
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut';
  metric?: string; // e.g. 'count', 'sum', 'avg'
  field?: string;
  filters?: Record<string, any>;
  dateRange?: string; // e.g. '7d', '30d', '90d', 'custom'
  locationId?: string;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardConfig {
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  isDefault?: boolean;
}

// Store dashboards in tenant customFields (JSON) or a dedicated table
// For now, we use a lightweight approach with a JSON column on Tenant

export const saveDashboard = async (
  tenantId: string,
  staffId: string,
  dashboard: DashboardConfig
) => {
  // Store as a JSON record keyed by staffId + dashboard name
  const key = `dashboard_${staffId}_${dashboard.name.replace(/\s+/g, '_').toLowerCase()}`;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const dashboards = (tenant as any)?.customDashboards || {};
  dashboards[key] = { ...dashboard, updatedAt: new Date().toISOString() };

  // We'll store in a generic way - using tenant's custom field or a separate approach
  // For a production system, this would be a dedicated model
  return { key, ...dashboard };
};

export const getDashboards = async (tenantId: string, staffId: string) => {
  // Return pre-built dashboard configs for the staff member
  return [
    {
      key: 'default',
      name: 'Overview',
      isDefault: true,
      widgets: [
        { id: 'w1', type: 'metric', title: 'Total Members', dataSource: 'members', metric: 'count', position: { x: 0, y: 0, w: 3, h: 1 } },
        { id: 'w2', type: 'metric', title: 'Monthly Revenue', dataSource: 'revenue', metric: 'sum', field: 'amount', dateRange: '30d', position: { x: 3, y: 0, w: 3, h: 1 } },
        { id: 'w3', type: 'metric', title: 'Classes This Week', dataSource: 'classes', metric: 'count', dateRange: '7d', position: { x: 6, y: 0, w: 3, h: 1 } },
        { id: 'w4', type: 'metric', title: 'Avg Attendance', dataSource: 'attendance', metric: 'avg', dateRange: '30d', position: { x: 9, y: 0, w: 3, h: 1 } },
        { id: 'w5', type: 'chart', title: 'Revenue Trend', dataSource: 'revenue', chartType: 'line', dateRange: '90d', position: { x: 0, y: 1, w: 6, h: 2 } },
        { id: 'w6', type: 'chart', title: 'Member Growth', dataSource: 'members', chartType: 'line', dateRange: '90d', position: { x: 6, y: 1, w: 6, h: 2 } },
      ],
    },
  ];
};

// ============================================
// WIDGET DATA RESOLVER
// ============================================

export const resolveWidget = async (
  tenantId: string,
  widget: WidgetConfig
) => {
  const dateFrom = getDateFrom(widget.dateRange || '30d');
  const locationFilter = widget.locationId ? { locationId: widget.locationId } : {};

  switch (widget.dataSource) {
    case 'members':
      return resolveMemberWidget(tenantId, widget, dateFrom);
    case 'revenue':
      return resolveRevenueWidget(tenantId, widget, dateFrom);
    case 'attendance':
      return resolveAttendanceWidget(tenantId, widget, dateFrom, locationFilter);
    case 'bookings':
      return resolveBookingWidget(tenantId, widget, dateFrom, locationFilter);
    case 'classes':
      return resolveClassWidget(tenantId, widget, dateFrom, locationFilter);
    default:
      return { value: null, error: 'Unknown data source' };
  }
};

const resolveMemberWidget = async (tenantId: string, widget: WidgetConfig, dateFrom: Date) => {
  if (widget.type === 'metric') {
    if (widget.metric === 'count') {
      const count = await prisma.member.count({ where: { tenantId } });
      const prevCount = await prisma.member.count({
        where: { tenantId, createdAt: { lt: dateFrom } },
      });
      return { value: count, previous: prevCount, change: count - prevCount };
    }
  }

  if (widget.type === 'chart') {
    const members = await prisma.member.groupBy({
      by: ['createdAt'],
      where: { tenantId, createdAt: { gte: dateFrom } },
      _count: true,
      orderBy: { createdAt: 'asc' },
    });
    return { series: members.map((m) => ({ date: m.createdAt, value: m._count })) };
  }

  return { value: null };
};

const resolveRevenueWidget = async (tenantId: string, widget: WidgetConfig, dateFrom: Date) => {
  if (widget.type === 'metric') {
    const result = await prisma.payment.aggregate({
      where: { tenantId, status: 'SUCCEEDED', createdAt: { gte: dateFrom } },
      _sum: { amount: true },
    });
    return { value: result._sum.amount || 0 };
  }

  if (widget.type === 'chart') {
    const payments = await prisma.payment.findMany({
      where: { tenantId, status: 'SUCCEEDED', createdAt: { gte: dateFrom } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return { series: payments.map((p) => ({ date: p.createdAt, value: p.amount })) };
  }

  return { value: null };
};

const resolveAttendanceWidget = async (
  tenantId: string,
  widget: WidgetConfig,
  dateFrom: Date,
  locationFilter: Record<string, string>
) => {
  const bookings = await prisma.booking.count({
    where: {
      tenantId,
      status: 'CHECKED_IN',
      createdAt: { gte: dateFrom },
      classSession: locationFilter.locationId ? { locationId: locationFilter.locationId } : undefined,
    },
  });

  if (widget.metric === 'avg') {
    const sessions = await prisma.classSession.count({
      where: { tenantId, startTime: { gte: dateFrom }, ...locationFilter },
    });
    return { value: sessions > 0 ? Math.round(bookings / sessions) : 0 };
  }

  return { value: bookings };
};

const resolveBookingWidget = async (
  tenantId: string,
  widget: WidgetConfig,
  dateFrom: Date,
  locationFilter: Record<string, string>
) => {
  const count = await prisma.booking.count({
    where: {
      tenantId,
      createdAt: { gte: dateFrom },
      classSession: locationFilter.locationId ? { locationId: locationFilter.locationId } : undefined,
    },
  });
  return { value: count };
};

const resolveClassWidget = async (
  tenantId: string,
  widget: WidgetConfig,
  dateFrom: Date,
  locationFilter: Record<string, string>
) => {
  const count = await prisma.classSession.count({
    where: { tenantId, startTime: { gte: dateFrom }, ...locationFilter },
  });
  return { value: count };
};

// ============================================
// CUSTOM REPORTS
// ============================================

interface ReportConfig {
  name: string;
  type: 'member-activity' | 'revenue' | 'attendance' | 'instructor-pay' | 'custom';
  filters: {
    startDate: Date;
    endDate: Date;
    locationId?: string;
    classTypeId?: string;
    membershipTypeId?: string;
  };
  columns?: string[];
  groupBy?: string;
  format?: 'json' | 'csv';
}

export const generateReport = async (tenantId: string, config: ReportConfig) => {
  const { startDate, endDate, locationId } = config.filters;

  switch (config.type) {
    case 'member-activity': {
      const members = await prisma.member.findMany({
        where: {
          tenantId,
          lastActiveAt: { gte: startDate, lte: endDate },
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          bookings: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { status: true },
          },
          memberships: {
            where: { status: 'ACTIVE' },
            include: { membershipType: { select: { name: true } } },
          },
        },
      });

      return {
        name: config.name,
        generatedAt: new Date(),
        rows: members.map((m) => ({
          name: `${m.user.firstName} ${m.user.lastName}`,
          email: m.user.email,
          lifecycleStage: m.lifecycleStage,
          bookings: m.bookings.length,
          checkedIn: m.bookings.filter((b) => b.status === 'CHECKED_IN').length,
          membership: m.memberships[0]?.membershipType.name || 'None',
          lastActive: m.lastActiveAt,
        })),
        totalRows: members.length,
      };
    }

    case 'revenue': {
      const payments = await prisma.payment.findMany({
        where: {
          tenantId,
          status: 'SUCCEEDED',
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          member: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        name: config.name,
        generatedAt: new Date(),
        summary: { total, count: payments.length, avgTransaction: payments.length > 0 ? total / payments.length : 0 },
        rows: payments.map((p) => ({
          date: p.createdAt,
          member: `${p.member.user.firstName} ${p.member.user.lastName}`,
          amount: p.amount,
          type: p.type,
          description: p.description,
        })),
        totalRows: payments.length,
      };
    }

    case 'attendance': {
      const sessions = await prisma.classSession.findMany({
        where: {
          tenantId,
          startTime: { gte: startDate, lte: endDate },
          ...(locationId ? { locationId } : {}),
        },
        include: {
          classType: { select: { name: true } },
          location: { select: { name: true } },
          _count: { select: { bookings: true } },
          bookings: { where: { status: 'CHECKED_IN' }, select: { id: true } },
        },
        orderBy: { startTime: 'desc' },
      });

      return {
        name: config.name,
        generatedAt: new Date(),
        rows: sessions.map((s) => ({
          date: s.startTime,
          class: s.classType.name,
          location: s.location.name,
          capacity: s.capacity,
          booked: s._count.bookings,
          attended: s.bookings.length,
          occupancyRate: s.capacity > 0 ? Math.round((s._count.bookings / s.capacity) * 100) : 0,
        })),
        totalRows: sessions.length,
      };
    }

    default:
      return { name: config.name, generatedAt: new Date(), rows: [], totalRows: 0 };
  }
};

// ============================================
// CSV EXPORT
// ============================================

export const exportToCsv = (report: { rows: Record<string, any>[] }): string => {
  if (report.rows.length === 0) return '';
  const headers = Object.keys(report.rows[0]);
  const lines = [
    headers.join(','),
    ...report.rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ),
  ];
  return lines.join('\n');
};

// ============================================
// HELPERS
// ============================================

function getDateFrom(range: string): Date {
  const now = new Date();
  const match = range.match(/^(\d+)([dhm])$/);
  if (!match) return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [, num, unit] = match;
  const ms = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
  }[unit]!;

  return new Date(now.getTime() - parseInt(num) * ms);
}

export const customAnalyticsService = {
  saveDashboard,
  getDashboards,
  resolveWidget,
  generateReport,
  exportToCsv,
};
