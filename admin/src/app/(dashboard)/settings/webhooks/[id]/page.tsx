'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Webhook,
  Play,
  RefreshCw,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Copy,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { webhooksApi } from '@/lib/api/webhooks.api';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  FAILING: 'bg-red-100 text-red-800',
};

export default function WebhookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const defaultTab = searchParams.get('tab') || 'details';

  const { data: webhook, isLoading } = useQuery({
    queryKey: ['webhooks', params.id],
    queryFn: () => webhooksApi.get(params.id as string),
  });

  const { data: logs } = useQuery({
    queryKey: ['webhooks', params.id, 'logs'],
    queryFn: () => webhooksApi.getLogs(params.id as string, { limit: 50 }),
  });

  const testMutation = useMutation({
    mutationFn: () => webhooksApi.test(params.id as string),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Webhook test successful');
      } else {
        toast.error(`Test failed with status ${result.responseStatus}`);
      }
      setIsTesting(false);
    },
    onError: () => {
      toast.error('Failed to test webhook');
      setIsTesting(false);
    },
  });

  const rotateSecretMutation = useMutation({
    mutationFn: () => webhooksApi.rotateSecret(params.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', params.id] });
      toast.success('Secret rotated successfully');
      setShowRotateDialog(false);
    },
    onError: () => {
      toast.error('Failed to rotate secret');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Webhook className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Webhook not found</h3>
        <Button variant="link" onClick={() => router.push('/settings/webhooks')}>
          Back to Webhooks
        </Button>
      </div>
    );
  }

  const status = !webhook.isActive
    ? 'INACTIVE'
    : webhook.failureCount > 5
    ? 'FAILING'
    : 'ACTIVE';

  const successRate = logs?.data
    ? (logs.data.filter((l) => l.success).length / logs.data.length) * 100 || 0
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{webhook.name}</h1>
            <StatusBadge status={status} colorMap={statusColors} />
          </div>
          <p className="text-muted-foreground truncate">{webhook.url}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsTesting(true);
              testMutation.mutate();
            }}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Test
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/settings/webhooks/${webhook.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Deliveries"
          value={logs?.pagination.total || 0}
          icon={<Webhook className="h-4 w-4" />}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Failed Deliveries"
          value={webhook.failureCount}
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Last Triggered"
          value={
            webhook.lastTriggeredAt
              ? format(new Date(webhook.lastTriggeredAt), 'MMM d, HH:mm')
              : 'Never'
          }
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endpoint URL</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm">{webhook.url}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(webhook.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <span key={event} className="rounded-full bg-muted px-3 py-1 text-sm">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="mt-1">{format(new Date(webhook.createdAt), 'PPP')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signing Secret</CardTitle>
              <CardDescription>
                Use this secret to verify webhook payloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 font-mono text-sm flex-1">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span>whsec_•••••••••••••••••••••••</span>
                </div>
                <Button variant="outline" onClick={() => setShowRotateDialog(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rotate
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                All payloads are signed with HMAC SHA-256 using this secret
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
              <CardDescription>Last 50 webhook deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs?.data.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    {log.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.event}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.responseStatus || 'Error'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')} • {log.duration}ms
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
                {(!logs?.data || logs.data.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No delivery logs yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showRotateDialog}
        onOpenChange={setShowRotateDialog}
        title="Rotate Signing Secret"
        description="This will generate a new signing secret. Make sure to update your server to use the new secret."
        confirmLabel="Rotate Secret"
        onConfirm={() => rotateSecretMutation.mutate()}
        isLoading={rotateSecretMutation.isPending}
      />
    </div>
  );
}
