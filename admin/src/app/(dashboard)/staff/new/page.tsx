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
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/layout/page-header';
import { staffApi, CreateStaffData } from '@/lib/api/staff.api';
import { locationsApi } from '@/lib/api/locations.api';

const createStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'FRONT_DESK']),
  locationIds: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  bio: z.string().optional(),
});

type CreateStaffForm = z.infer<typeof createStaffSchema>;

export default function NewStaffPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      role: 'INSTRUCTOR',
      locationIds: [],
    },
  });

  const selectedLocationIds = watch('locationIds') || [];

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStaffData) => staffApi.create(data),
    onSuccess: (staff) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member added successfully');
      router.push(`/staff/${staff.id}`);
    },
    onError: () => {
      toast.error('Failed to add staff member');
    },
  });

  const onSubmit = (data: CreateStaffForm) => {
    createMutation.mutate(data);
  };

  const toggleLocation = (locationId: string) => {
    const current = selectedLocationIds;
    if (current.includes(locationId)) {
      setValue('locationIds', current.filter((id) => id !== locationId));
    } else {
      setValue('locationIds', [...current, locationId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Add Staff Member" description="Add a new team member" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>Enter the details for the new staff member.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} placeholder="John" />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...register('phone')} placeholder="+1 (555) 123-4567" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                      <SelectItem value="FRONT_DESK">Front Desk</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (cents, optional)</Label>
              <Input
                id="hourlyRate"
                type="number"
                {...register('hourlyRate', { valueAsNumber: true })}
                placeholder="2500"
              />
              <p className="text-xs text-muted-foreground">Enter in cents (e.g., 2500 = $25.00/hr)</p>
            </div>

            <div className="space-y-2">
              <Label>Locations</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {locations?.data.map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={selectedLocationIds.includes(location.id)}
                      onCheckedChange={() => toggleLocation(location.id)}
                    />
                    <label
                      htmlFor={`location-${location.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {location.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select the locations this staff member can work at</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="A brief bio about this staff member..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Staff Member
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
