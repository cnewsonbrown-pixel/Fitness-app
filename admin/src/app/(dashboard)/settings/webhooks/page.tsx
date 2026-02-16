'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  Plus,
  Webhook,
  Play,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { webhooksApi, Webhook as WebhookType } from '@/lib/api/webhooks.api';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  FAILING: 'bg-red-100 text-red-800',
};

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks', { page, pageSize }],
    queryFn: () => webhooksApi.list({ page: page + 1, limit: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => webhooksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete webhook');
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => webhooksApi.test(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Webhook test successful');
      } else {
        toast.error(`Webhook test failed: ${result.responseStatus}`);
      }
      setTestingId(null);
    },
    onError: () => {
      toast.error('Failed to test webhook');
      setTestingId(null);
    },
  });

  const handleTest = (id: string) => {
    setTestingId(id);
    testMutation.mutate(id);
  };

  const columns: ColumnDef<WebhookType>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Webhook" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Webhook className="h-5 w-5" />
          </div>
          <div>
            <Link
              href={`/settings/webhooks/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {row.original.url}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = !row.original.isActive
          ? 'INACTIVE'
          : row.original.failureCount > 5
          ? 'FAILING'
          : 'ACTIVE';
        return <StatusBadge status={status} colorMap={statusColors} />;
      },
    },
    {
      accessorKey: 'events',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Events" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.events.slice(0, 2).map((event) => (
            <span key={event} className="rounded bg-muted px-2 py-0.5 text-xs">
              {event}
            </span>
          ))}
          {row.original.events.length > 2 && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs">
              +{row.original.events.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'lastTriggeredAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Triggered" />,
      cell: ({ row }) =>
        row.original.lastTriggeredAt
          ? format(new Date(row.original.lastTriggeredAt), 'MMM d, yyyy HH:mm')
          : 'Never',
    },
    {
      accessorKey: 'failureCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Health" />,
      cell: ({ row }) => {
        const failures = row.original.failureCount;
        if (failures === 0) {
          return (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Healthy</span>
            </div>
          );
        }
        if (failures <= 5) {
          return (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{failures} failures</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Failing</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTest(row.original.id)}
            disabled={testingId === row.original.id}
          >
            {testingId === row.original.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Test
          </Button>
          <DataTableRowActions
            row={row}
            actions={[
              { label: 'View Details', href: `/settings/webhooks/${row.original.id}` },
              { label: 'Edit', href: `/settings/webhooks/${row.original.id}/edit` },
              { label: 'View Logs', href: `/settings/webhooks/${row.original.id}?tab=logs` },
              { label: 'Rotate Secret', onClick: () => toast.info('Rotate secret coming soon') },
              {
                label: 'Delete',
                onClick: () => setDeleteId(row.original.id),
                variant: 'destructive' as const,
                separator: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Webhooks" description="Receive real-time notifications for events">
        <Link href="/settings/webhooks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search webhooks..."
        isLoading={isLoading}
        pageCount={data?.pagination.totalPages ?? 0}
        pageIndex={page}
        pageSize={pageSize}
        onPaginationChange={(newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        }}
        manualPagination
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Webhook"
        description="Are you sure you want to delete this webhook? You will no longer receive notifications for its events."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
