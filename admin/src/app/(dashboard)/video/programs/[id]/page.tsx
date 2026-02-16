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
  Plus,
  GripVertical,
  Trash2,
  BarChart2,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { videoProgramsApi, videosApi } from '@/lib/api/video.api';
import { useState } from 'react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
};

const difficultyColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
  ADVANCED: 'bg-red-100 text-red-800',
};

export default function VideoProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);

  const { data: program, isLoading } = useQuery({
    queryKey: ['video-programs', params.id],
    queryFn: () => videoProgramsApi.get(params.id as string),
  });

  const { data: videos } = useQuery({
    queryKey: ['videos', { programId: params.id }],
    queryFn: () => videosApi.list({ programId: params.id as string, limit: 100 }),
  });

  const { data: analytics } = useQuery({
    queryKey: ['video-programs', params.id, 'analytics'],
    queryFn: () => videoProgramsApi.getAnalytics(params.id as string),
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      program?.isPublished
        ? videoProgramsApi.unpublish(params.id as string)
        : videoProgramsApi.publish(params.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-programs', params.id] });
      toast.success(program?.isPublished ? 'Program unpublished' : 'Program published');
      setShowPublishDialog(false);
    },
    onError: () => {
      toast.error('Failed to update program status');
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => videosApi.delete(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', { programId: params.id }] });
      toast.success('Video deleted');
      setDeleteVideoId(null);
    },
    onError: () => {
      toast.error('Failed to delete video');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Video className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Program not found</h3>
        <Button variant="link" onClick={() => router.push('/video/programs')}>
          Back to Programs
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{program.name}</h1>
            <StatusBadge status={program.isPublished ? 'PUBLISHED' : 'DRAFT'} colorMap={statusColors} />
            {program.difficulty && (
              <StatusBadge status={program.difficulty} colorMap={difficultyColors} />
            )}
          </div>
          <p className="text-muted-foreground">{program.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/video/programs/${program.id}/analytics`}>
            <Button variant="outline">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowPublishDialog(true)}>
            {program.isPublished ? (
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
          <Button variant="outline" onClick={() => router.push(`/video/programs/${program.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Videos"
          value={program.videoCount || 0}
          icon={<Video className="h-4 w-4" />}
        />
        <StatCard
          title="Total Views"
          value={(analytics?.totalViews || 0).toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatCard
          title="Unique Viewers"
          value={(analytics?.uniqueViewers || 0).toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatCard
          title="Avg. Completion"
          value={`${(analytics?.avgCompletionRate || 0).toFixed(1)}%`}
          icon={<Play className="h-4 w-4" />}
        />
      </div>

      {/* Program Thumbnail */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                {program.thumbnailUrl ? (
                  <img
                    src={program.thumbnailUrl}
                    alt={program.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{program.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Duration</p>
                  <p>{formatDuration(program.totalDuration || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p>{program.createdAt && format(new Date(program.createdAt), 'PPP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Videos List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Videos</CardTitle>
                <CardDescription>Videos in this program</CardDescription>
              </div>
              <Link href={`/video/videos/new?programId=${program.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Video
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {videos?.data.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="relative h-16 w-24 overflow-hidden rounded bg-muted">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/video/videos/${video.id}`}
                        className="font-medium hover:underline"
                      >
                        {index + 1}. {video.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {video.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {(video.viewCount || 0).toLocaleString()}
                      </div>
                      <StatusBadge
                        status={video.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        colorMap={statusColors}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteVideoId(video.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(!videos?.data || videos.data.length === 0) && (
                  <div className="text-center py-8">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No videos in this program</p>
                    <Link href={`/video/videos/new?programId=${program.id}`}>
                      <Button variant="link" className="mt-2">
                        Add your first video
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        title={program.isPublished ? 'Unpublish Program' : 'Publish Program'}
        description={
          program.isPublished
            ? 'This program will no longer be visible to members. Existing watch progress will be preserved.'
            : 'This program will be visible to all members. Make sure all videos are ready.'
        }
        confirmLabel={program.isPublished ? 'Unpublish' : 'Publish'}
        onConfirm={() => publishMutation.mutate()}
        isLoading={publishMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteVideoId}
        onOpenChange={() => setDeleteVideoId(null)}
        title="Delete Video"
        description="Are you sure you want to delete this video? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteVideoId && deleteVideoMutation.mutate(deleteVideoId)}
        isLoading={deleteVideoMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
