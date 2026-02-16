'use client';

import { Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { tenant } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${tenant ? `, ${tenant.name}` : ''}`}
        description="Here's an overview of your gym's performance"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value="1,234"
          icon={Users}
          trend={12.5}
          trendLabel="from last month"
        />
        <StatCard
          title="Monthly Revenue"
          value="$45,231"
          icon={DollarSign}
          trend={8.2}
          trendLabel="from last month"
        />
        <StatCard
          title="Classes This Week"
          value="48"
          icon={Calendar}
          trend={4}
          trendLabel="from last week"
        />
        <StatCard
          title="Attendance Rate"
          value="87%"
          icon={TrendingUp}
          trend={-2.1}
          trendLabel="from last week"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest bookings and check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Activity feed will appear here once connected to the API.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>Classes scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Today&apos;s schedule will appear here once connected to the API.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
