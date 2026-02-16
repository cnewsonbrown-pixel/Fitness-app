'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { AreaChart } from '@/components/shared/area-chart';
import { PieChart } from '@/components/shared/pie-chart';
import { BarChart } from '@/components/shared/bar-chart';
import { analyticsApi } from '@/lib/api/analytics.api';
import { formatCurrency } from '@/lib/utils';

export default function RevenueReportPage() {
  const router = useRouter();

  const { data: report, isLoading } = useQuery({
    queryKey: ['analytics', 'reports', 'revenue'],
    queryFn: () => analyticsApi.getRevenueReport(),
  });

  const handleExport = async () => {
    try {
      const result = await analyticsApi.exportReport('revenue', 'csv');
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
        <PageHeader title="Revenue Report" description="Analyze revenue trends and sources">
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
            <StatCard title="Total Revenue" value={formatCurrency(report.totalRevenue)} icon={DollarSign} />
            <StatCard title="Recurring" value={formatCurrency(report.recurringRevenue)} icon={DollarSign} />
            <StatCard title="One-Time" value={formatCurrency(report.oneTimeRevenue)} icon={DollarSign} />
            <StatCard title="Refunds" value={formatCurrency(report.refunds)} icon={DollarSign} />
            <StatCard title="Net Revenue" value={formatCurrency(report.netRevenue)} icon={DollarSign} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend */}
            <ChartCard title="Revenue Trend" description="Revenue over time" className="lg:col-span-2">
              {report.revenueTrend && report.revenueTrend.length > 0 ? (
                <AreaChart
                  data={report.revenueTrend.map((d) => ({
                    ...d,
                    revenue: d.revenue / 100,
                  }))}
                  xKey="date"
                  areas={[{ dataKey: 'revenue', name: 'Revenue', color: '#10b981' }]}
                  height={350}
                  yAxisFormatter={(v) => `$${v}`}
                  tooltipFormatter={(v) => formatCurrency(v * 100)}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No trend data available
                </div>
              )}
            </ChartCard>

            {/* Revenue by Source */}
            <ChartCard title="Revenue by Source">
              {report.revenueBySource && report.revenueBySource.length > 0 ? (
                <PieChart
                  data={report.revenueBySource.map((d, i) => ({
                    name: d.source,
                    value: d.revenue,
                    color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'][i % 4],
                  }))}
                  height={300}
                  innerRadius={60}
                  outerRadius={100}
                  tooltipFormatter={(v) => formatCurrency(v)}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No source data available
                </div>
              )}
            </ChartCard>

            {/* Top Memberships */}
            <ChartCard title="Top Memberships by Revenue">
              {report.topMemberships && report.topMemberships.length > 0 ? (
                <BarChart
                  data={report.topMemberships.map((d) => ({
                    ...d,
                    revenue: d.revenue / 100,
                  }))}
                  xKey="name"
                  bars={[{ dataKey: 'revenue', name: 'Revenue', color: '#6366f1' }]}
                  height={300}
                  yAxisFormatter={(v) => `$${v}`}
                  tooltipFormatter={(v) => formatCurrency(v * 100)}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No membership data available
                </div>
              )}
            </ChartCard>
          </div>

          {/* Top Memberships Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              {report.topMemberships && report.topMemberships.length > 0 ? (
                <div className="space-y-3">
                  {report.topMemberships.map((membership, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{membership.name}</p>
                        <p className="text-sm text-muted-foreground">{membership.subscribers} subscribers</p>
                      </div>
                      <span className="font-semibold">{formatCurrency(membership.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No membership data available</p>
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
