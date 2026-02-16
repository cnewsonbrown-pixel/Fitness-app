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
import { templatesApi, CreateTemplateData } from '@/lib/api/crm.api';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
});

type CreateTemplateForm = z.infer<typeof createTemplateSchema>;

export default function NewTemplatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTemplateForm>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      category: 'General',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateData) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
      router.push('/crm/templates');
    },
    onError: () => {
      toast.error('Failed to create template');
    },
  });

  const onSubmit = (data: CreateTemplateForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Template" description="Create a reusable email template" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Configure your email template</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Welcome Email" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register('category')} placeholder="e.g., Onboarding" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  {...register('subject')}
                  placeholder="e.g., Welcome to {{gymName}}!"
                />
                {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="Write your email content here..."
                  rows={12}
                  className="font-mono text-sm"
                />
                {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{gymName}}'}, {'{{membershipName}}'}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Template
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your email will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white p-6">
              <div className="border-b pb-4 mb-4">
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-medium">Welcome to FitStudio!</p>
              </div>
              <div className="prose prose-sm max-w-none">
                <p>Hi John,</p>
                <p>Welcome to FitStudio! We're thrilled to have you as a member.</p>
                <p>Your membership details:</p>
                <ul>
                  <li>Membership: Monthly Unlimited</li>
                  <li>Start Date: Today</li>
                </ul>
                <p>Ready to get started? Book your first class now!</p>
                <p>Best,<br />The FitStudio Team</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
