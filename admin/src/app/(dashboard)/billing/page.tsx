'use client';

import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { AreaChart } from '@/components/shared/area-chart';
import { PieChart } from '@/components/shared/pie-chart';
import { StatusBadge } from '@/components/shared/status-badge';
import { billingApi, Payment } from '@/lib/api/billing.api';
import { formatCurrency } from '@/lib/utils';

const paymentStatusColors: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function BillingPage() {
  const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');

  const { data: revenueSummary } = useQuery({
    queryKey: ['billing', 'revenue', 'summary', { startDate, endDate }],
    queryFn: () => billingApi.getRevenueSummary({ startDate, endDate }),
  });

  const { data: revenueByPeriod } = useQuery({
    queryKey: ['billing', 'revenue', 'by-period', { startDate, endDate }],
    queryFn: () => billingApi.getRevenueByPeriod({ startDate, endDate, interval: 'day' }),
  });

  const { data: revenueByType } = useQuery({
    queryKey: ['billing', 'revenue', 'by-type', { startDate, endDate }],
    queryFn: () => billingApi.getRevenueByType({ startDate, endDate }),
  });

  const { data: recentPayments } = useQuery({
    queryKey: ['billing', 'payments', { limit: 5 }],
    queryFn: () => billingApi.listPayments({ limit: 5 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Revenue overview and payment management">
        <div className="flex gap-2">
          <Link href="/billing/payments">
            <Button variant="outline">View All Payments</Button>
          </Link>
          <Link href="/billing/subscriptions">
            <Button variant="outline">Manage Subscriptions</Button>
          </Link>
        </div>
      </PageHeader>

      {/* Revenue Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenueSummary?.totalRevenue || 0)}
          icon={DollarSign}
          trend={
            revenueSummary?.growthRate
              ? {
                  value: Math.abs(revenueSummary.growthRate),
                  direction: revenueSummary.growthRate >= 0 ? 'up' : 'down',
                }
              : undefined
          }
        />
        <StatCard
          title="Recurring Revenue"
          value={formatCurrency(revenueSummary?.recurringRevenue || 0)}
          icon={RefreshCw}
        />
        <StatCard
          title="One-Time Revenue"
          value={formatCurrency(revenueSummary?.oneTimeRevenue || 0)}
          icon={CreditCard}
        />
        <StatCard
          title="Net Revenue"
          value={formatCurrency(revenueSummary?.netRevenue || 0)}
          icon={TrendingUp}
          description={`After ${formatCurrency(revenueSummary?.refunds || 0)} in refunds`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" description="Last 30 days" className="lg:col-span-2">
          {revenueByPeriod && revenueByPeriod.length > 0 ? (
            <AreaChart
              data={revenueByPeriod.map((d) => ({
                date: format(new Date(d.date), 'MMM d'),
                revenue: d.revenue / 100,
                refunds: d.refunds / 100,
              }))}
              xKey="date"
              areas={[
                { dataKey: 'revenue', name: 'Revenue', color: '#10b981' },
                { dataKey: 'refunds', name: 'Refunds', color: '#ef4444' },
              ]}
              height={300}
              yAxisFormatter={(v) => `$${v}`}
              tooltipFormatter={(v) => formatCurrency(v * 100)}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No revenue data available
            </div>
          )}
        </ChartCard>

        {/* Revenue by Type */}
        <ChartCard title="Revenue by Type">
          {revenueByType && revenueByType.length > 0 ? (
            <PieChart
              data={revenueByType.map((d, i) => ({
                name: d.type,
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
              No data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <Link href="/billing/payments">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentPayments?.data && recentPayments.data.length > 0 ? (
            <div className="space-y-4">
              {recentPayments.data.map((payment: Payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {payment.member?.firstName} {payment.member?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <StatusBadge status={payment.status} colorMap={paymentStatusColors} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent payments</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
