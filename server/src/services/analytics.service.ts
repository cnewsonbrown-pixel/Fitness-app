import { prisma } from '../config/database.js';
import { PaymentStatus } from '@prisma/client';

export class AnalyticsService {
  // ===== DASHBOARD METRICS =====

  async getDashboard(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      totalMembers,
      newMembersThisMonth,
      newMembersPrevMonth,
      activeMemberships,
      classesThisMonth,
      bookingsThisMonth,
      checkInsThisMonth,
      revenueThisMonth,
      revenuePrevMonth,
      membersByStage,
    ] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.member.count({ where: { tenantId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.memberMembership.count({ where: { member: { tenantId }, status: 'ACTIVE' } }),
      prisma.classSession.count({ where: { tenantId, startTime: { gte: thirtyDaysAgo }, status: { in: ['COMPLETED', 'SCHEDULED', 'IN_PROGRESS'] } } }),
      prisma.booking.count({ where: { classSession: { tenantId }, bookedAt: { gte: thirtyDaysAgo }, status: { in: ['BOOKED', 'CHECKED_IN'] } } }),
      prisma.booking.count({ where: { classSession: { tenantId }, status: 'CHECKED_IN', checkedInAt: { gte: thirtyDaysAgo } } }),
      prisma.payment.aggregate({ where: { tenantId, status: PaymentStatus.SUCCEEDED, paidAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { tenantId, status: PaymentStatus.SUCCEEDED, paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }, _sum: { amount: true } }),
      prisma.member.groupBy({ by: ['lifecycleStage'], where: { tenantId }, _count: true }),
    ]);

    const revenue = Number(revenueThisMonth._sum.amount || 0);
    const prevRevenue = Number(revenuePrevMonth._sum.amount || 0);
    const attendanceRate = bookingsThisMonth > 0 ? Math.round((checkInsThisMonth / bookingsThisMonth) * 100) : 0;
    const memberGrowth = newMembersPrevMonth > 0 ? Math.round(((newMembersThisMonth - newMembersPrevMonth) / newMembersPrevMonth) * 100) : 0;

    return {
      members: {
        total: totalMembers,
        newThisMonth: newMembersThisMonth,
        growthPercent: memberGrowth,
        activeMemberships,
        byStage: membersByStage.reduce((acc, item) => { acc[item.lifecycleStage] = item._count; return acc; }, {} as Record<string, number>),
      },
      classes: {
        totalThisMonth: classesThisMonth,
        totalBookings: bookingsThisMonth,
        totalCheckIns: checkInsThisMonth,
        attendanceRate,
      },
      revenue: {
        thisMonth: revenue,
        previousMonth: prevRevenue,
        growthPercent: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0,
      },
    };
  }

  /**
   * Popular class times (by hour of day)
   */
  async getPopularTimes(tenantId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await prisma.classSession.findMany({
      where: { tenantId, startTime: { gte: since }, status: 'COMPLETED' },
      select: { startTime: true, spotsBooked: true, capacity: true },
    });

    const byHour: Record<number, { count: number; totalBooked: number; totalCapacity: number }> = {};

    for (const s of sessions) {
      const hour = s.startTime.getHours();
      if (!byHour[hour]) byHour[hour] = { count: 0, totalBooked: 0, totalCapacity: 0 };
      byHour[hour].count++;
      byHour[hour].totalBooked += s.spotsBooked;
      byHour[hour].totalCapacity += s.capacity;
    }

    return Object.entries(byHour)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        classCount: data.count,
        avgOccupancy: data.totalCapacity > 0 ? Math.round((data.totalBooked / data.totalCapacity) * 100) : 0,
      }))
      .sort((a, b) => b.avgOccupancy - a.avgOccupancy);
  }

  /**
   * Retention rate: % of members active 30 days ago still active now
   */
  async getRetentionRate(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeThirtyDaysAgo, stillActive] = await Promise.all([
      prisma.member.count({
        where: { tenantId, createdAt: { lt: thirtyDaysAgo }, memberships: { some: { status: 'ACTIVE' } } },
      }),
      prisma.member.count({
        where: {
          tenantId,
          createdAt: { lt: thirtyDaysAgo },
          memberships: { some: { status: 'ACTIVE' } },
          lastActiveAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      activeThirtyDaysAgo,
      stillActive,
      retentionRate: activeThirtyDaysAgo > 0 ? Math.round((stillActive / activeThirtyDaysAgo) * 100) : 0,
    };
  }

  // ===== REPORTS =====

  /**
   * Member activity report
   */
  async memberActivityReport(tenantId: string, startDate: Date, endDate: Date) {
    const members = await prisma.member.findMany({
      where: { tenantId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        bookings: {
          where: { bookedAt: { gte: startDate, lte: endDate } },
          select: { status: true },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { membershipType: { select: { name: true } } },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return members.map((m) => ({
      id: m.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      email: m.user.email,
      lifecycleStage: m.lifecycleStage,
      membership: m.memberships[0]?.membershipType.name || 'None',
      bookings: m.bookings.length,
      checkIns: m.bookings.filter((b) => b.status === 'CHECKED_IN').length,
      noShows: m.bookings.filter((b) => b.status === 'NO_SHOW').length,
      lastActive: m.lastActiveAt,
    }));
  }

  /**
   * Revenue report by type and period
   */
  async revenueReport(tenantId: string, startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: { tenantId, status: PaymentStatus.SUCCEEDED, paidAt: { gte: startDate, lte: endDate } },
      orderBy: { paidAt: 'asc' },
    });

    const byType: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const p of payments) {
      byType[p.type] = (byType[p.type] || 0) + Number(p.amount);
      const day = p.paidAt!.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + Number(p.amount);
    }

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      period: { startDate, endDate },
      total,
      count: payments.length,
      byType,
      daily: Object.entries(byDay).map(([date, amount]) => ({ date, amount })),
    };
  }

  /**
   * Class attendance report
   */
  async attendanceReport(tenantId: string, startDate: Date, endDate: Date) {
    const sessions = await prisma.classSession.findMany({
      where: { tenantId, startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
      include: {
        classType: { select: { name: true } },
        location: { select: { name: true } },
        instructor: { select: { displayName: true } },
      },
    });

    const byClassType: Record<string, { sessions: number; totalBooked: number; totalCapacity: number }> = {};

    for (const s of sessions) {
      const name = s.classType.name;
      if (!byClassType[name]) byClassType[name] = { sessions: 0, totalBooked: 0, totalCapacity: 0 };
      byClassType[name].sessions++;
      byClassType[name].totalBooked += s.spotsBooked;
      byClassType[name].totalCapacity += s.capacity;
    }

    return {
      period: { startDate, endDate },
      totalSessions: sessions.length,
      totalBooked: sessions.reduce((sum, s) => sum + s.spotsBooked, 0),
      totalCapacity: sessions.reduce((sum, s) => sum + s.capacity, 0),
      byClassType: Object.entries(byClassType).map(([name, data]) => ({
        name,
        sessions: data.sessions,
        avgOccupancy: data.totalCapacity > 0 ? Math.round((data.totalBooked / data.totalCapacity) * 100) : 0,
      })),
      sessions: sessions.map((s) => ({
        id: s.id,
        classType: s.classType.name,
        instructor: s.instructor.displayName,
        location: s.location.name,
        date: s.startTime,
        booked: s.spotsBooked,
        capacity: s.capacity,
        occupancy: s.capacity > 0 ? Math.round((s.spotsBooked / s.capacity) * 100) : 0,
      })),
    };
  }

  /**
   * Instructor pay report
   */
  async instructorPayReport(tenantId: string, startDate: Date, endDate: Date) {
    const instructors = await prisma.staff.findMany({
      where: { tenantId, isInstructor: true, isActive: true },
      select: {
        id: true,
        displayName: true,
        payRate: true,
        classSessions: {
          where: { status: 'COMPLETED', startTime: { gte: startDate, lte: endDate } },
          select: { id: true },
        },
      },
    });

    return {
      period: { startDate, endDate },
      instructors: instructors.map((i) => {
        const classCount = i.classSessions.length;
        const rate = Number(i.payRate);
        return {
          id: i.id,
          name: i.displayName,
          classCount,
          rate,
          totalPay: classCount * rate,
        };
      }),
      totalPay: instructors.reduce((sum, i) => sum + i.classSessions.length * Number(i.payRate), 0),
    };
  }
}

export const analyticsService = new AnalyticsService();
