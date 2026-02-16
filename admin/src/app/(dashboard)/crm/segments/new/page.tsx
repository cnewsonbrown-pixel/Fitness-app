'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { segmentsApi, CreateSegmentData } from '@/lib/api/crm.api';

const ruleSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.string().min(1, 'Operator is required'),
  value: z.string().min(1, 'Value is required'),
});

const createSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logic: z.enum(['AND', 'OR']),
  rules: z.array(ruleSchema).min(1, 'At least one rule is required'),
});

type CreateSegmentForm = z.infer<typeof createSegmentSchema>;

const fieldOptions = [
  { value: 'membershipType', label: 'Membership Type' },
  { value: 'membershipStatus', label: 'Membership Status' },
  { value: 'joinDate', label: 'Join Date' },
  { value: 'lastVisit', label: 'Last Visit' },
  { value: 'totalClasses', label: 'Total Classes Attended' },
  { value: 'totalSpent', label: 'Total Spent' },
  { value: 'tags', label: 'Tags' },
  { value: 'location', label: 'Primary Location' },
];

const operatorOptions = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'in', label: 'is one of' },
  { value: 'not_in', label: 'is not one of' },
];

export default function NewSegmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateSegmentForm>({
    resolver: zodResolver(createSegmentSchema),
    defaultValues: {
      logic: 'AND',
      rules: [{ field: '', operator: 'equals', value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSegmentData) => segmentsApi.create(data),
    onSuccess: (segment) => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segment created successfully');
      router.push(`/crm/segments/${segment.id}`);
    },
    onError: () => {
      toast.error('Failed to create segment');
    },
  });

  const onSubmit = (data: CreateSegmentForm) => {
    const segmentData: CreateSegmentData = {
      name: data.name,
      description: data.description,
      rules: {
        logic: data.logic,
        rules: data.rules.map((r) => ({
          field: r.field,
          operator: r.operator as 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in',
          value: r.value,
        })),
      },
    };
    createMutation.mutate(segmentData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Segment" description="Define a targeted group of members" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Segment Details</CardTitle>
            <CardDescription>Basic information about your segment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Segment Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Active Monthly Members" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="What defines this segment?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Segment Rules</CardTitle>
                <CardDescription>Define criteria for members to be included</CardDescription>
              </div>
              <Select
                value={watch('logic')}
                onValueChange={(value) => {
                  const event = { target: { value, name: 'logic' } };
                  register('logic').onChange(event);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={watch(`rules.${index}.field`)}
                    onValueChange={(value) => {
                      const event = { target: { value, name: `rules.${index}.field` } };
                      register(`rules.${index}.field`).onChange(event);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={watch(`rules.${index}.operator`)}
                    onValueChange={(value) => {
                      const event = { target: { value, name: `rules.${index}.operator` } };
                      register(`rules.${index}.operator`).onChange(event);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Value</Label>
                  <Input {...register(`rules.${index}.value`)} placeholder="Enter value" />
                </div>

                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ field: '', operator: 'equals', value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>

            {errors.rules && <p className="text-sm text-destructive">{errors.rules.message}</p>}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Segment
          </Button>
        </div>
      </form>
    </div>
  );
}
