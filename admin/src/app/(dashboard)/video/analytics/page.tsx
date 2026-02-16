'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Video, Eye, Clock, Users, TrendingUp, Play, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { LineChart } from '@/components/shared/line-chart';
import { BarChart } from '@/components/shared/bar-chart';
import { PieChart } from '@/components/shared/pie-chart';
import { videoAnalyticsApi } from '@/lib/api/video.api';
import Link from 'next/link';

export default function VideoAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const startDate = format(
    subDays(new Date(), dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90),
    'yyyy-MM-dd'
  );
  const endDate = format(new Date(), 'yyyy-MM-dd');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['video-analytics', { startDate, endDate }],
    queryFn: () => videoAnalyticsApi.getLibraryAnalytics({ startDate, endDate }),
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const viewsTrendData = analytics?.viewsTrend?.map((d) => ({
    name: format(new Date(d.date), 'MMM d'),
    views: d.views,
  })) || [];

  const categoryData = analytics?.viewsByCategory?.map((c) => ({
    name: c.category,
    value: c.views,
  })) || [];

  const topVideosData = analytics?.topVideos?.slice(0, 10).map((v) => ({
    name: v.title.length > 20 ? v.title.substring(0, 20) + '...' : v.title,
    views: v.views,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Video Analytics" description="Track video performance and engagement">
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </PageHeader>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Videos"
          value={analytics?.totalVideos || 0}
          icon={<Video className="h-4 w-4" />}
          description="In your library"
        />
        <StatCard
          title="Total Programs"
          value={analytics?.totalPrograms || 0}
          icon={<Play className="h-4 w-4" />}
          description="Published programs"
        />
        <StatCard
          title="Total Views"
          value={(analytics?.totalViews || 0).toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
          description="In selected period"
        />
        <StatCard
          title="Watch Time"
          value={formatDuration(analytics?.totalWatchTime || 0)}
          icon={<Clock className="h-4 w-4" />}
          description="Total watch time"
        />
      </div>

      {/* Views Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
          <CardDescription>Daily video views trend</CardDescription>
        </CardHeader>
        <CardContent>
          {viewsTrendData.length > 0 ? (
            <LineChart data={viewsTrendData} xKey="name" yKey="views" height={300} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No view data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Views by Category</CardTitle>
            <CardDescription>Distribution of views across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <PieChart data={categoryData} height={300} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Videos</CardTitle>
            <CardDescription>Most viewed videos in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {topVideosData.length > 0 ? (
              <BarChart data={topVideosData} xKey="name" yKey="views" height={300} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No video data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Video Performance</CardTitle>
          <CardDescription>Detailed metrics for top performing videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topVideos?.slice(0, 10).map((video, index) => (
              <div
                key={video.videoId}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/video/videos/${video.videoId}`}
                    className="font-medium hover:underline"
                  >
                    {video.title}
                  </Link>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{video.views.toLocaleString()}</p>
                    <p className="text-muted-foreground">views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{video.completionRate.toFixed(1)}%</p>
                    <p className="text-muted-foreground">completion</p>
                  </div>
                </div>
              </div>
            ))}
            {(!analytics?.topVideos || analytics.topVideos.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No video data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
