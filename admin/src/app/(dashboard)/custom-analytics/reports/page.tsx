'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, FileText, Play, Download, Calendar, MoreVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { customReportsApi, CustomReport } from '@/lib/api/custom-analytics.api';

const scheduleColors: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-800',
  WEEKLY: 'bg-green-100 text-green-800',
  MONTHLY: 'bg-purple-100 text-purple-800',
  MANUAL: 'bg-gray-100 text-gray-800',
};

export default function CustomReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['custom-reports', { page, pageSize }],
    queryFn: () => customReportsApi.list({ page: page + 1, limit: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customReportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      toast.success('Report deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete report');
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => customReportsApi.run(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      toast.success('Report generated successfully');
      setRunningId(null);
    },
    onError: () => {
      toast.error('Failed to run report');
      setRunningId(null);
    },
  });

  const handleRun = (id: string) => {
    setRunningId(id);
    runMutation.mutate(id);
  };

  const columns: ColumnDef<CustomReport>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Report" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <Link
              href={`/custom-analytics/reports/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {row.original.description || 'No description'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'schedule',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Schedule" />,
      cell: ({ row }) => {
        const schedule = row.original.schedule;
        return (
          <StatusBadge
            status={schedule?.frequency || 'MANUAL'}
            colorMap={scheduleColors}
          />
        );
      },
    },
    {
      accessorKey: 'config.dateRange',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Range" />,
      cell: ({ row }) => (
        <span className="capitalize">
          {row.original.config.dateRange?.toLowerCase().replace(/_/g, ' ') || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'lastRunAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Run" />,
      cell: ({ row }) =>
        row.original.lastRunAt
          ? format(new Date(row.original.lastRunAt), 'MMM d, yyyy HH:mm')
          : 'Never',
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRun(row.original.id)}
            disabled={runningId === row.original.id}
          >
            {runningId === row.original.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/custom-analytics/reports/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Export coming soon')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Schedule coming soon')}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(row.original.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Custom Reports" description="Create and manage custom reports">
        <Link href="/custom-analytics/reports/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search reports..."
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
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
