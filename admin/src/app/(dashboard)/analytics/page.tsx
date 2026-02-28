'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, DollarSign, Calendar, TrendingUp, Clock, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { AreaChart } from '@/components/shared/area-chart';
import { BarChart } from '@/components/shared/bar-chart';
import { analyticsApi } from '@/lib/api/analytics.api';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { data: kpis } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboardKPIs(),
  });

  const { data: memberActivity } = useQuery({
    queryKey: ['analytics', 'reports', 'member-activity'],
    queryFn: () => analyticsApi.getMemberActivityReport(),
  });

  const { data: attendance } = useQuery({
    queryKey: ['analytics', 'reports', 'attendance'],
    queryFn: () => analyticsApi.getAttendanceReport(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Business insights and performance metrics">
        <div className="flex gap-2">
          <Link href="/analytics/reports">
            <Button variant="outline">
              View Reports <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Members"
          value={kpis?.totalMembers || 0}
          icon={Users}
          trend={kpis?.membersGrowth}
        />
        <StatCard
          title="Active Members"
          value={kpis?.activeMembers || 0}
          icon={Users}
          trend={kpis?.activeMembersGrowth}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(kpis?.monthlyRevenue || 0)}
          icon={DollarSign}
          trend={kpis?.revenueGrowth}
        />
        <StatCard
          title="Class Attendance"
          value={`${kpis?.classAttendance || 0}%`}
          icon={Calendar}
          trend={kpis?.attendanceGrowth}
        />
        <StatCard
          title="Avg. Retention"
          value={`${kpis?.averageRetention || 0}%`}
          icon={TrendingUp}
          trend={kpis?.retentionGrowth}
        />
        <StatCard
          title="New Signups"
          value={kpis?.newSignups || 0}
          icon={UserPlus}
          trend={kpis?.signupsGrowth}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Activity Trend */}
        <ChartCard title="Member Activity Trend" description="Active vs inactive members over time">
          {memberActivity?.activityTrend && memberActivity.activityTrend.length > 0 ? (
            <AreaChart
              data={memberActivity.activityTrend}
              xKey="date"
              areas={[
                { dataKey: 'active', name: 'Active', color: '#10b981' },
                { dataKey: 'inactive', name: 'Inactive', color: '#f59e0b' },
              ]}
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </ChartCard>

        {/* Attendance by Day */}
        <ChartCard title="Attendance by Day" description="Average class attendance by day of week">
          {attendance?.attendanceByDay && attendance.attendanceByDay.length > 0 ? (
            <BarChart
              data={attendance.attendanceByDay.map((d) => ({
                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.dayOfWeek],
                attendance: d.attendance,
              }))}
              xKey="day"
              bars={[{ dataKey: 'attendance', name: 'Attendance', color: '#6366f1' }]}
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </ChartCard>

        {/* Attendance by Class Type */}
        <ChartCard title="Attendance by Class Type" description="Fill rate by class type">
          {attendance?.attendanceByClassType && attendance.attendanceByClassType.length > 0 ? (
            <BarChart
              data={attendance.attendanceByClassType}
              xKey="classType"
              bars={[
                { dataKey: 'attendance', name: 'Attendance', color: '#6366f1' },
                { dataKey: 'fillRate', name: 'Fill Rate %', color: '#10b981' },
              ]}
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </ChartCard>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/analytics/popular-times" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Popular Times</p>
                  <p className="text-sm text-muted-foreground">See when your gym is busiest</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/analytics/retention" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Retention Analysis</p>
                  <p className="text-sm text-muted-foreground">Cohort retention breakdown</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/analytics/reports" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">All Reports</p>
                  <p className="text-sm text-muted-foreground">Member activity, revenue, attendance & more</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
