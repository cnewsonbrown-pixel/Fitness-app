'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { PageHeader } from '@/components/layout/page-header';
import { campaignsApi, CreateCampaignData } from '@/lib/api/marketing.api';
import { segmentsApi } from '@/lib/api/crm.api';

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['EMAIL', 'SMS', 'PUSH']),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  segmentId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type CreateCampaignForm = z.infer<typeof createCampaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      type: 'EMAIL',
    },
  });

  const campaignType = watch('type');

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignData) => campaignsApi.create(data),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
      router.push(`/marketing/campaigns/${campaign.id}`);
    },
    onError: () => {
      toast.error('Failed to create campaign');
    },
  });

  const onSubmit = (data: CreateCampaignForm) => {
    createMutation.mutate({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Campaign" description="Set up a new marketing campaign" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Configure your campaign settings and content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Summer Promotion" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="PUSH">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {campaignType === 'EMAIL' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input id="subject" {...register('subject')} placeholder="e.g., Don't miss our summer sale!" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="segmentId">Target Audience (optional)</Label>
              <Controller
                name="segmentId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="All members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All members</SelectItem>
                      {segments?.data.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment.memberCount} members)
                        </SelectItem>
                      ))}
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
                placeholder="Write your campaign message here..."
                rows={8}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
              <p className="text-xs text-muted-foreground">
                You can use variables like {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule (optional)</Label>
              <Input id="scheduledAt" type="datetime-local" {...register('scheduledAt')} />
              <p className="text-xs text-muted-foreground">Leave empty to send manually later</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
