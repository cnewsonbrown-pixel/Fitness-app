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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { leadFormsApi, CreateLeadFormData } from '@/lib/api/marketing.api';

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'textarea']),
  required: z.boolean(),
  options: z.string().optional(),
});

const createFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1, 'At least one field is required'),
  thankYouMessage: z.string().optional(),
  redirectUrl: z.string().url().optional().or(z.literal('')),
});

type CreateFormData = z.infer<typeof createFormSchema>;

export default function NewLeadFormPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      fields: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeadFormData) => leadFormsApi.create(data),
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: ['lead-forms'] });
      toast.success('Lead form created successfully');
      router.push(`/marketing/lead-forms/${form.id}`);
    },
    onError: () => {
      toast.error('Failed to create lead form');
    },
  });

  const onSubmit = (data: CreateFormData) => {
    const formData: CreateLeadFormData = {
      name: data.name,
      description: data.description,
      fields: data.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options ? f.options.split(',').map((o) => o.trim()) : undefined,
      })),
      thankYouMessage: data.thankYouMessage,
      redirectUrl: data.redirectUrl || undefined,
    };
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Lead Form" description="Set up a new lead capture form" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>Basic information about your form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Free Trial Signup" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="What is this form for?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Define the fields for your form</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', label: '', type: 'text', required: false })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const fieldType = watch(`fields.${index}.type`);
              return (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Field {index + 1}</p>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Field Name</Label>
                      <Input {...register(`fields.${index}.name`)} placeholder="e.g., email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input {...register(`fields.${index}.label`)} placeholder="e.g., Email Address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={fieldType}
                        onValueChange={(value) => {
                          const event = { target: { value, name: `fields.${index}.type` } };
                          register(`fields.${index}.type`).onChange(event);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id={`required-${index}`}
                        {...register(`fields.${index}.required`)}
                      />
                      <label htmlFor={`required-${index}`} className="text-sm">
                        Required field
                      </label>
                    </div>
                  </div>

                  {fieldType === 'select' && (
                    <div className="space-y-2">
                      <Label>Options (comma-separated)</Label>
                      <Input
                        {...register(`fields.${index}.options`)}
                        placeholder="e.g., Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {errors.fields && <p className="text-sm text-destructive">{errors.fields.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After Submission</CardTitle>
            <CardDescription>What happens after someone submits the form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thankYouMessage">Thank You Message</Label>
              <Textarea
                id="thankYouMessage"
                {...register('thankYouMessage')}
                placeholder="Thank you for your interest! We'll be in touch soon."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUrl">Redirect URL (optional)</Label>
              <Input
                id="redirectUrl"
                {...register('redirectUrl')}
                placeholder="https://example.com/thank-you"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Form
          </Button>
        </div>
      </form>
    </div>
  );
}
