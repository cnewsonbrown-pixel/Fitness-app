'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { membershipTypesApi, CreateMembershipTypeData } from '@/lib/api/memberships.api';

const createMembershipSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['RECURRING', 'CLASS_PACK', 'DROP_IN']),
  price: z.number().min(0, 'Price must be 0 or greater'),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY', 'WEEKLY']).optional(),
  classCredits: z.number().min(1).optional(),
  description: z.string().optional(),
});

type CreateMembershipForm = z.infer<typeof createMembershipSchema>;

export default function NewMembershipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMembershipForm>({
    resolver: zodResolver(createMembershipSchema),
    defaultValues: {
      type: 'RECURRING',
    },
  });

  const membershipType = watch('type');

  const createMutation = useMutation({
    mutationFn: (data: CreateMembershipTypeData) => membershipTypesApi.create(data),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: ['membership-types'] });
      toast.success('Membership type created successfully');
      router.push(`/memberships/${membership.id}`);
    },
    onError: () => {
      toast.error('Failed to create membership type');
    },
  });

  const onSubmit = (data: CreateMembershipForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Add Membership Type" description="Create a new membership plan" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Membership Information</CardTitle>
          <CardDescription>Configure the pricing and features for this membership.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Monthly Unlimited" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select onValueChange={(value) => setValue('type', value as 'RECURRING' | 'CLASS_PACK' | 'DROP_IN')} value={membershipType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECURRING">Recurring Subscription</SelectItem>
                  <SelectItem value="CLASS_PACK">Class Pack</SelectItem>
                  <SelectItem value="DROP_IN">Drop-In</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (cents)</Label>
                <Input
                  id="price"
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="9900"
                />
                <p className="text-xs text-muted-foreground">Enter price in cents (e.g., 9900 = $99.00)</p>
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>

              {membershipType === 'RECURRING' && (
                <div className="space-y-2">
                  <Label htmlFor="billingPeriod">Billing Period</Label>
                  <Select onValueChange={(value) => setValue('billingPeriod', value as 'MONTHLY' | 'YEARLY' | 'WEEKLY')} value={watch('billingPeriod')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {membershipType === 'CLASS_PACK' && (
              <div className="space-y-2">
                <Label htmlFor="classCredits">Number of Classes</Label>
                <Input
                  id="classCredits"
                  type="number"
                  {...register('classCredits', { valueAsNumber: true })}
                  placeholder="10"
                />
                {errors.classCredits && <p className="text-sm text-destructive">{errors.classCredits.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what's included in this membership..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Membership
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
