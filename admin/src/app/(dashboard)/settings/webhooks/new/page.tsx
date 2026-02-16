'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/layout/page-header';
import { webhooksApi, CreateWebhookData } from '@/lib/api/webhooks.api';
import { useState } from 'react';

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
});

type CreateWebhookForm = z.infer<typeof createWebhookSchema>;

const defaultEvents = [
  { key: 'member.created', label: 'Member Created', description: 'When a new member signs up' },
  { key: 'member.updated', label: 'Member Updated', description: 'When member profile changes' },
  { key: 'member.deleted', label: 'Member Deleted', description: 'When a member is removed' },
  { key: 'booking.created', label: 'Booking Created', description: 'When a booking is made' },
  { key: 'booking.cancelled', label: 'Booking Cancelled', description: 'When a booking is cancelled' },
  { key: 'booking.checked_in', label: 'Booking Check-in', description: 'When member checks in' },
  { key: 'payment.succeeded', label: 'Payment Succeeded', description: 'When payment is successful' },
  { key: 'payment.failed', label: 'Payment Failed', description: 'When payment fails' },
  { key: 'subscription.created', label: 'Subscription Created', description: 'New subscription started' },
  { key: 'subscription.cancelled', label: 'Subscription Cancelled', description: 'Subscription cancelled' },
  { key: 'class.started', label: 'Class Started', description: 'When a class begins' },
  { key: 'class.completed', label: 'Class Completed', description: 'When a class ends' },
];

export default function NewWebhookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWebhookForm>({
    resolver: zodResolver(createWebhookSchema),
  });

  const { data: events } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => webhooksApi.getEvents(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWebhookData) => webhooksApi.create(data),
    onSuccess: (webhook) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully');
      router.push(`/settings/webhooks/${webhook.id}`);
    },
    onError: () => {
      toast.error('Failed to create webhook');
    },
  });

  const onSubmit = (data: CreateWebhookForm) => {
    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }
    createMutation.mutate({
      ...data,
      events: selectedEvents,
    });
  };

  const toggleEvent = (eventKey: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventKey) ? prev.filter((e) => e !== eventKey) : [...prev, eventKey]
    );
  };

  const toggleAll = () => {
    const allEvents = (events || defaultEvents).map((e) => e.key);
    if (selectedEvents.length === allEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(allEvents);
    }
  };

  const availableEvents = events || defaultEvents;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Webhook" description="Set up a new webhook endpoint" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Details</CardTitle>
            <CardDescription>Configure your webhook endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Production Notifications"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                {...register('url')}
                placeholder="https://your-server.com/webhook"
              />
              {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
              <p className="text-xs text-muted-foreground">
                This endpoint must accept POST requests and respond with a 2xx status code
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Events</CardTitle>
                <CardDescription>Select which events should trigger this webhook</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {selectedEvents.length === availableEvents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableEvents.map((event) => (
                <div
                  key={event.key}
                  className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedEvents.includes(event.key)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleEvent(event.key)}
                >
                  <Checkbox
                    checked={selectedEvents.includes(event.key)}
                    onCheckedChange={() => toggleEvent(event.key)}
                  />
                  <div>
                    <p className="font-medium">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="mt-4 text-sm text-destructive">
                Please select at least one event
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || selectedEvents.length === 0}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Webhook
          </Button>
        </div>
      </form>
    </div>
  );
}
