'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Video,
  Play,
  Eye,
  Clock,
  Edit,
  BarChart2,
  Globe,
  Lock,
  Loader2,
  Users,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LineChart } from '@/components/shared/line-chart';
import { videosApi } from '@/lib/api/video.api';
import { useState } from 'react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
};

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const { data: video, isLoading } = useQuery({
    queryKey: ['videos', params.id],
    queryFn: () => videosApi.get(params.id as string),
  });

  const { data: analytics } = useQuery({
    queryKey: ['videos', params.id, 'analytics'],
    queryFn: () => videosApi.getAnalytics(params.id as string),
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      video?.isPublished
        ? videosApi.unpublish(params.id as string)
        : videosApi.publish(params.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', params.id] });
      toast.success(video?.isPublished ? 'Video unpublished' : 'Video published');
      setShowPublishDialog(false);
    },
    onError: () => {
      toast.error('Failed to update video status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Video className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Video not found</h3>
        <Button variant="link" onClick={() => router.push('/video/videos')}>
          Back to Videos
        </Button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const viewsChartData = analytics?.viewsByDay?.map((d) => ({
    name: format(new Date(d.date), 'MMM d'),
    views: d.views,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <StatusBadge status={video.isPublished ? 'PUBLISHED' : 'DRAFT'} colorMap={statusColors} />
          </div>
          <p className="text-muted-foreground">{video.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPublishDialog(true)}>
            {video.isPublished ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/video/videos/${video.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Views"
          value={(analytics?.totalViews || 0).toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatCard
          title="Unique Viewers"
          value={(analytics?.uniqueViewers || 0).toLocaleString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Avg. Watch Time"
          value={formatDuration(analytics?.avgWatchTime || 0)}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Completion Rate"
          value={`${(analytics?.completionRate || 0).toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                {video.videoUrl ? (
                  <video
                    src={video.videoUrl}
                    controls
                    className="h-full w-full"
                    poster={video.thumbnailUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="mx-auto h-16 w-16" />
                      <p className="mt-2">Video not available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Views Chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Daily view counts</CardDescription>
            </CardHeader>
            <CardContent>
              {viewsChartData.length > 0 ? (
                <LineChart
                  data={viewsChartData}
                  xKey="name"
                  yKey="views"
                  height={250}
                />
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  No view data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDuration(video.duration || 0)}
                </p>
              </div>
              {video.programId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Program</p>
                  <Link
                    href={`/video/programs/${video.programId}`}
                    className="text-primary hover:underline"
                  >
                    {video.programName || 'View Program'}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{video.createdAt && format(new Date(video.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p>{video.updatedAt && format(new Date(video.updatedAt), 'PPP')}</p>
              </div>
              {video.order !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order in Program</p>
                  <p>#{video.order + 1}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span className="font-medium">{(analytics?.completionRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${analytics?.completionRate || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Watch Progress</span>
                    <span className="font-medium">
                      {video.duration
                        ? `${((analytics?.avgWatchTime || 0) / video.duration * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${video.duration ? ((analytics?.avgWatchTime || 0) / video.duration * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        title={video.isPublished ? 'Unpublish Video' : 'Publish Video'}
        description={
          video.isPublished
            ? 'This video will no longer be visible to members.'
            : 'This video will be visible to all members.'
        }
        confirmLabel={video.isPublished ? 'Unpublish' : 'Publish'}
        onConfirm={() => publishMutation.mutate()}
        isLoading={publishMutation.isPending}
      />
    </div>
  );
}
