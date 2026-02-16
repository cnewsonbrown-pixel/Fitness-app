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
import { journeysApi, CreateJourneyData, segmentsApi } from '@/lib/api/crm.api';

const createJourneySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger: z.enum(['SIGNUP', 'MEMBERSHIP_PURCHASE', 'CLASS_BOOKING', 'INACTIVITY', 'CUSTOM']),
  segmentId: z.string().optional(),
});

type CreateJourneyForm = z.infer<typeof createJourneySchema>;

export default function NewJourneyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateJourneyForm>({
    resolver: zodResolver(createJourneySchema),
    defaultValues: {
      trigger: 'SIGNUP',
    },
  });

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateJourneyData) => journeysApi.create(data),
    onSuccess: (journey) => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
      toast.success('Journey created successfully');
      router.push(`/crm/journeys/${journey.id}`);
    },
    onError: () => {
      toast.error('Failed to create journey');
    },
  });

  const onSubmit = (data: CreateJourneyForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Journey" description="Set up an automated member engagement workflow" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Journey Details</CardTitle>
          <CardDescription>Configure the basic settings for your journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Journey Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., New Member Onboarding" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="What does this journey do?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger</Label>
              <Controller
                name="trigger"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIGNUP">New Signup</SelectItem>
                      <SelectItem value="MEMBERSHIP_PURCHASE">Membership Purchase</SelectItem>
                      <SelectItem value="CLASS_BOOKING">Class Booking</SelectItem>
                      <SelectItem value="INACTIVITY">Inactivity (no visits)</SelectItem>
                      <SelectItem value="CUSTOM">Custom Trigger</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                When should members enter this journey?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmentId">Target Segment (optional)</Label>
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
              <p className="text-xs text-muted-foreground">
                Limit this journey to members in a specific segment
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Journey
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
