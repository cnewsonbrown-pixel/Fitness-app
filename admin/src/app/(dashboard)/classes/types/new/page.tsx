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
import { PageHeader } from '@/components/layout/page-header';
import { classTypesApi, CreateClassTypeData } from '@/lib/api/classes.api';

const createClassTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  color: z.string().optional(),
});

type CreateClassTypeForm = z.infer<typeof createClassTypeSchema>;

export default function NewClassTypePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClassTypeForm>({
    resolver: zodResolver(createClassTypeSchema),
    defaultValues: {
      duration: 60,
      capacity: 20,
      color: '#6366f1',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClassTypeData) => classTypesApi.create(data),
    onSuccess: (classType) => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      toast.success('Class type created successfully');
      router.push(`/classes/types/${classType.id}`);
    },
    onError: () => {
      toast.error('Failed to create class type');
    },
  });

  const onSubmit = (data: CreateClassTypeForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Add Class Type" description="Create a new class offering" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>Configure the details for this class type.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., HIIT Training" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what this class involves..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  placeholder="60"
                />
                {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  placeholder="20"
                />
                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    {...register('color')}
                    className="h-10 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    {...register('color')}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Class Type
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
