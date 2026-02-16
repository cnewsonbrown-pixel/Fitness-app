'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { classSessionsApi, classTypesApi, CreateClassSessionData } from '@/lib/api/classes.api';
import { locationsApi } from '@/lib/api/locations.api';
import { staffApi } from '@/lib/api/staff.api';

const createSessionSchema = z.object({
  classTypeId: z.string().min(1, 'Class type is required'),
  locationId: z.string().min(1, 'Location is required'),
  instructorId: z.string().min(1, 'Instructor is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.number().optional(),
  notes: z.string().optional(),
});

type CreateSessionForm = z.infer<typeof createSessionSchema>;

export default function NewClassSessionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const selectedClassTypeId = watch('classTypeId');
  const selectedLocationId = watch('locationId');

  const { data: classTypes } = useQuery({
    queryKey: ['class-types', { isActive: true }],
    queryFn: () => classTypesApi.list({ isActive: true, limit: 100 }),
  });

  const { data: locations } = useQuery({
    queryKey: ['locations', { isActive: true }],
    queryFn: () => locationsApi.list({ isActive: true, limit: 100 }),
  });

  const { data: instructors } = useQuery({
    queryKey: ['staff', 'instructors', { locationId: selectedLocationId, classTypeId: selectedClassTypeId }],
    queryFn: () => staffApi.listInstructors({ locationId: selectedLocationId, classTypeId: selectedClassTypeId }),
    enabled: !!selectedLocationId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClassSessionData) => classSessionsApi.create(data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      toast.success('Class session scheduled successfully');
      router.push(`/classes/sessions/${session.id}`);
    },
    onError: () => {
      toast.error('Failed to schedule class session');
    },
  });

  const onSubmit = (data: CreateSessionForm) => {
    const startTime = new Date(`${data.date}T${data.startTime}`).toISOString();
    const endTime = new Date(`${data.date}T${data.endTime}`).toISOString();

    createMutation.mutate({
      classTypeId: data.classTypeId,
      locationId: data.locationId,
      instructorId: data.instructorId,
      startTime,
      endTime,
      capacity: data.capacity,
      notes: data.notes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Schedule Class Session" description="Create a new class instance" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Configure the class session.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classTypeId">Class Type</Label>
              <Controller
                name="classTypeId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class type" />
                    </SelectTrigger>
                    <SelectContent>
                      {classTypes?.data.map((classType) => (
                        <SelectItem key={classType.id} value={classType.id}>
                          {classType.name} ({classType.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.classTypeId && <p className="text-sm text-destructive">{errors.classTypeId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.data.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructorId">Instructor</Label>
              <Controller
                name="instructorId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedLocationId ? 'Select instructor' : 'Select a location first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors?.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.user.firstName} {instructor.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.instructorId && <p className="text-sm text-destructive">{errors.instructorId.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" {...register('startTime')} />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" {...register('endTime')} />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity Override (optional)</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity', { valueAsNumber: true })}
                placeholder="Leave blank to use class type default"
              />
              <p className="text-xs text-muted-foreground">Override the default capacity for this specific session</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any special notes for this session..."
                rows={2}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
