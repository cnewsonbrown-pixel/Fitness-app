'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/page-header';
import { videoProgramsApi, CreateProgramData } from '@/lib/api/video.api';

const createProgramSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  isPublished: z.boolean(),
});

type CreateProgramForm = z.infer<typeof createProgramSchema>;

export default function NewVideoProgramPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateProgramForm>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: {
      difficulty: 'BEGINNER',
      isPublished: false,
    },
  });

  const thumbnailUrl = watch('thumbnailUrl');

  const createMutation = useMutation({
    mutationFn: (data: CreateProgramData) => videoProgramsApi.create(data),
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ['video-programs'] });
      toast.success('Program created successfully');
      router.push(`/video/programs/${program.id}`);
    },
    onError: () => {
      toast.error('Failed to create program');
    },
  });

  const onSubmit = (data: CreateProgramForm) => {
    createMutation.mutate({
      ...data,
      thumbnailUrl: data.thumbnailUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Program" description="Create a new video training program" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>Configure your video program</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., 30-Day Strength Challenge" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe what this program covers..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Strength, Cardio, Yoga"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  {...register('thumbnailUrl')}
                  placeholder="https://..."
                />
                {errors.thumbnailUrl && (
                  <p className="text-sm text-destructive">{errors.thumbnailUrl.message}</p>
                )}
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
                  Create Program
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your program will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{watch('name') || 'Program Name'}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {watch('description') || 'Program description will appear here...'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {watch('category') || 'Category'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      watch('difficulty') === 'ADVANCED'
                        ? 'bg-red-100 text-red-800'
                        : watch('difficulty') === 'INTERMEDIATE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {watch('difficulty') || 'Beginner'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
