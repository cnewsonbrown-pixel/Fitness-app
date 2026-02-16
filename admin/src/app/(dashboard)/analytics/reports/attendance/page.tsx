'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { AreaChart } from '@/components/shared/area-chart';
import { BarChart } from '@/components/shared/bar-chart';
import { analyticsApi } from '@/lib/api/analytics.api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceReportPage() {
  const router = useRouter();

  const { data: report, isLoading } = useQuery({
    queryKey: ['analytics', 'reports', 'attendance'],
    queryFn: () => analyticsApi.getAttendanceReport(),
  });

  const handleExport = async () => {
    try {
      const result = await analyticsApi.exportReport('attendance', 'csv');
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Attendance Report" description="Class attendance and fill rate analysis">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </PageHeader>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>
      ) : report ? (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Classes" value={report.totalClasses} icon={Calendar} />
            <StatCard title="Total Attendees" value={report.totalAttendees} icon={Calendar} />
            <StatCard title="Avg. Attendance" value={Math.round(report.averageAttendance)} icon={Calendar} />
            <StatCard title="Fill Rate" value={`${Math.round(report.fillRate)}%`} icon={Calendar} />
            <StatCard title="No-Show Rate" value={`${Math.round(report.noShowRate)}%`} icon={Calendar} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Attendance Trend */}
            <ChartCard title="Attendance Trend" description="Daily attendance over time" className="lg:col-span-2">
              {report.attendanceTrend && report.attendanceTrend.length > 0 ? (
                <AreaChart
                  data={report.attendanceTrend}
                  xKey="date"
                  areas={[{ dataKey: 'attendance', name: 'Attendance', color: '#6366f1' }]}
                  height={350}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No trend data available
                </div>
              )}
            </ChartCard>

            {/* Attendance by Day */}
            <ChartCard title="Attendance by Day of Week">
              {report.attendanceByDay && report.attendanceByDay.length > 0 ? (
                <BarChart
                  data={report.attendanceByDay.map((d) => ({
                    day: DAYS[d.dayOfWeek],
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
            <ChartCard title="Attendance by Class Type">
              {report.attendanceByClassType && report.attendanceByClassType.length > 0 ? (
                <BarChart
                  data={report.attendanceByClassType}
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
          </div>

          {/* Class Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Class Type Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {report.attendanceByClassType && report.attendanceByClassType.length > 0 ? (
                <div className="space-y-3">
                  {report.attendanceByClassType.map((classType, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{classType.classType}</p>
                        <p className="text-sm text-muted-foreground">
                          {classType.attendance} total attendees
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{Math.round(classType.fillRate)}%</p>
                        <p className="text-sm text-muted-foreground">fill rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No class data available</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
