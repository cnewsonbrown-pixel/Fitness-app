'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/page-header';
import { announcementsApi, CreateAnnouncementData } from '@/lib/api/content.api';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'URGENT']),
  targetAudience: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean(),
});

type CreateAnnouncementForm = z.infer<typeof createAnnouncementSchema>;

export default function NewAnnouncementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateAnnouncementForm>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      type: 'INFO',
      isActive: true,
    },
  });

  const watchType = watch('type');

  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementData) => announcementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created successfully');
      router.push('/content/announcements');
    },
    onError: () => {
      toast.error('Failed to create announcement');
    },
  });

  const onSubmit = (data: CreateAnnouncementForm) => {
    createMutation.mutate(data);
  };

  const typeStyles: Record<string, string> = {
    INFO: 'bg-blue-50 border-blue-200 text-blue-800',
    WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    SUCCESS: 'bg-green-50 border-green-200 text-green-800',
    URGENT: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Announcement" description="Create a new announcement for members and staff" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Details</CardTitle>
            <CardDescription>Configure your announcement settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register('title')} placeholder="e.g., Holiday Hours Update" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INFO">Info</SelectItem>
                        <SelectItem value="WARNING">Warning</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience (optional)</Label>
                <Controller
                  name="targetAudience"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="All members" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="MEMBERS">Members Only</SelectItem>
                        <SelectItem value="STAFF">Staff Only</SelectItem>
                        <SelectItem value="NEW_MEMBERS">New Members</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="Write your announcement content here..."
                  rows={6}
                />
                {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (optional)</Label>
                  <Input id="startDate" type="datetime-local" {...register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input id="endDate" type="datetime-local" {...register('endDate')} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="isActive">Active immediately</Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Announcement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your announcement will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg border-2 p-4 ${typeStyles[watchType]}`}>
              <h3 className="font-semibold">{watch('title') || 'Announcement Title'}</h3>
              <p className="mt-2 text-sm">{watch('content') || 'Your announcement content will appear here...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
