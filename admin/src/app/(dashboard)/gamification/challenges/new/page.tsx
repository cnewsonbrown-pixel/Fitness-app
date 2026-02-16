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
import { challengesApi, badgesApi, CreateChallengeData } from '@/lib/api/gamification.api';

const createChallengeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['ATTENDANCE', 'CLASS_COUNT', 'STREAK', 'POINTS', 'CUSTOM']),
  goal: z.string().optional(),
  targetValue: z.number().optional(),
  pointsReward: z.number().min(0, 'Points must be positive'),
  badgeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateChallengeForm = z.infer<typeof createChallengeSchema>;

export default function NewChallengePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateChallengeForm>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      type: 'ATTENDANCE',
      pointsReward: 100,
    },
  });

  const challengeType = watch('type');

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgesApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateChallengeData) => challengesApi.create(data),
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Challenge created successfully');
      router.push(`/gamification/challenges/${challenge.id}`);
    },
    onError: () => {
      toast.error('Failed to create challenge');
    },
  });

  const onSubmit = (data: CreateChallengeForm) => {
    createMutation.mutate(data);
  };

  const typeDescriptions: Record<string, string> = {
    ATTENDANCE: 'Track member attendance over a period',
    CLASS_COUNT: 'Complete a certain number of classes',
    STREAK: 'Maintain a consecutive attendance streak',
    POINTS: 'Earn a target number of points',
    CUSTOM: 'Custom challenge with manual tracking',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Challenge" description="Set up a new challenge for members" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Challenge Details</CardTitle>
          <CardDescription>Configure your challenge settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Challenge Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., January Fitness Challenge" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what members need to do to complete this challenge"
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Challenge Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                      <SelectItem value="CLASS_COUNT">Class Count</SelectItem>
                      <SelectItem value="STREAK">Streak</SelectItem>
                      <SelectItem value="POINTS">Points</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">{typeDescriptions[challengeType]}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal Description</Label>
              <Input
                id="goal"
                {...register('goal')}
                placeholder={
                  challengeType === 'CLASS_COUNT'
                    ? 'e.g., Attend 20 classes'
                    : challengeType === 'STREAK'
                    ? 'e.g., Maintain a 7-day streak'
                    : 'e.g., Complete the challenge requirements'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                {...register('targetValue', { valueAsNumber: true })}
                placeholder={
                  challengeType === 'CLASS_COUNT'
                    ? 'Number of classes'
                    : challengeType === 'STREAK'
                    ? 'Days in streak'
                    : challengeType === 'POINTS'
                    ? 'Points to earn'
                    : 'Target number'
                }
              />
              <p className="text-xs text-muted-foreground">
                {challengeType === 'CLASS_COUNT' && 'Number of classes to complete'}
                {challengeType === 'STREAK' && 'Number of consecutive days'}
                {challengeType === 'POINTS' && 'Total points to earn'}
                {challengeType === 'ATTENDANCE' && 'Number of check-ins'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="datetime-local" {...register('startDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="datetime-local" {...register('endDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsReward">Points Reward</Label>
              <Input
                id="pointsReward"
                type="number"
                {...register('pointsReward', { valueAsNumber: true })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">Points awarded upon completion</p>
              {errors.pointsReward && <p className="text-sm text-destructive">{errors.pointsReward.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="badgeId">Badge Reward (optional)</Label>
              <Controller
                name="badgeId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a badge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No badge</SelectItem>
                      {badges?.data.map((badge) => (
                        <SelectItem key={badge.id} value={badge.id}>
                          {badge.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">Award a badge upon completion</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Challenge
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
