'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { AreaChart } from '@/components/shared/area-chart';
import { PieChart } from '@/components/shared/pie-chart';
import { analyticsApi } from '@/lib/api/analytics.api';

export default function MemberActivityReportPage() {
  const router = useRouter();

  const { data: report, isLoading } = useQuery({
    queryKey: ['analytics', 'reports', 'member-activity'],
    queryFn: () => analyticsApi.getMemberActivityReport(),
  });

  const handleExport = async () => {
    try {
      const result = await analyticsApi.exportReport('member-activity', 'csv');
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
        <PageHeader title="Member Activity Report" description="Track member engagement and activity patterns">
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
            <StatCard title="Total Members" value={report.totalMembers} icon={Users} />
            <StatCard title="Active Members" value={report.activeMembers} icon={Users} />
            <StatCard title="Inactive Members" value={report.inactiveMembers} icon={Users} />
            <StatCard title="New Members" value={report.newMembers} icon={Users} />
            <StatCard title="Churned Members" value={report.churnedMembers} icon={Users} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Activity Trend */}
            <ChartCard title="Activity Trend" description="Active vs inactive members over time" className="lg:col-span-2">
              {report.activityTrend && report.activityTrend.length > 0 ? (
                <AreaChart
                  data={report.activityTrend}
                  xKey="date"
                  areas={[
                    { dataKey: 'active', name: 'Active', color: '#10b981' },
                    { dataKey: 'inactive', name: 'Inactive', color: '#f59e0b' },
                  ]}
                  height={350}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No trend data available
                </div>
              )}
            </ChartCard>

            {/* Members by Status */}
            <ChartCard title="Members by Status">
              {report.membersByStatus && report.membersByStatus.length > 0 ? (
                <PieChart
                  data={report.membersByStatus.map((d, i) => ({
                    name: d.status,
                    value: d.count,
                    color: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'][i % 4],
                  }))}
                  height={300}
                  innerRadius={60}
                  outerRadius={100}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No status data available
                </div>
              )}
            </ChartCard>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Activity Rate</span>
                  <span className="font-semibold">
                    {report.totalMembers > 0
                      ? Math.round((report.activeMembers / report.totalMembers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Churn Rate</span>
                  <span className="font-semibold">
                    {report.totalMembers > 0
                      ? Math.round((report.churnedMembers / report.totalMembers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">New Member Rate</span>
                  <span className="font-semibold">
                    {report.totalMembers > 0
                      ? Math.round((report.newMembers / report.totalMembers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Active/Inactive Ratio</span>
                  <span className="font-semibold">
                    {report.inactiveMembers > 0
                      ? (report.activeMembers / report.inactiveMembers).toFixed(2)
                      : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
