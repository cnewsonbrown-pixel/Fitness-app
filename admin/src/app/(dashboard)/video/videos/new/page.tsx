'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/page-header';
import { videosApi, videoProgramsApi, CreateVideoData } from '@/lib/api/video.api';

const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  programId: z.string().optional(),
  videoUrl: z.string().url('Valid video URL is required'),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().optional(),
  isPublished: z.boolean(),
});

type CreateVideoForm = z.infer<typeof createVideoSchema>;

export default function NewVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const defaultProgramId = searchParams.get('programId') || '';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateVideoForm>({
    resolver: zodResolver(createVideoSchema),
    defaultValues: {
      programId: defaultProgramId,
      isPublished: false,
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['video-programs'],
    queryFn: () => videoProgramsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVideoData) => videosApi.create(data),
    onSuccess: (video) => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      if (video.programId) {
        queryClient.invalidateQueries({ queryKey: ['videos', { programId: video.programId }] });
      }
      toast.success('Video created successfully');
      router.push(`/video/videos/${video.id}`);
    },
    onError: () => {
      toast.error('Failed to create video');
    },
  });

  const onSubmit = (data: CreateVideoForm) => {
    createMutation.mutate({
      ...data,
      programId: data.programId || undefined,
      thumbnailUrl: data.thumbnailUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Upload Video" description="Add a new video to your library" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
          <CardDescription>Configure your video settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input id="title" {...register('title')} placeholder="e.g., Day 1: Full Body Warmup" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what this video covers..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="programId">Program (optional)</Label>
              <Controller
                name="programId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Standalone Video</SelectItem>
                      {programs?.data.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="relative">
                <Input
                  id="videoUrl"
                  {...register('videoUrl')}
                  placeholder="https://..."
                  className="pr-24"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-1 top-1"
                  onClick={() => toast.info('Upload functionality would be implemented here')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              {errors.videoUrl && (
                <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter a video URL or upload a file (supports MP4, WebM, MOV)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
              <Input
                id="thumbnailUrl"
                {...register('thumbnailUrl')}
                placeholder="https://..."
              />
              {errors.thumbnailUrl && (
                <p className="text-sm text-destructive">{errors.thumbnailUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                {...register('duration', { valueAsNumber: true })}
                placeholder="300"
              />
              <p className="text-xs text-muted-foreground">Duration in seconds (e.g., 300 = 5 minutes)</p>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <Switch id="isPublished" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isPublished">Publish immediately</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Video
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
