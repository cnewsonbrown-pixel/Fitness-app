'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, GitBranch, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { journeysApi } from '@/lib/api/crm.api';
import { Journey } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
};

const triggerLabels: Record<string, string> = {
  SIGNUP: 'New Signup',
  MEMBERSHIP_PURCHASE: 'Membership Purchase',
  CLASS_BOOKING: 'Class Booking',
  INACTIVITY: 'Inactivity',
  CUSTOM: 'Custom Trigger',
};

const columns: ColumnDef<Journey>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Journey" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <GitBranch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Link href={`/crm/journeys/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          {row.original.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'trigger',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Trigger" />,
    cell: ({ row }) => triggerLabels[row.original.trigger] || row.original.trigger,
  },
  {
    accessorKey: 'enrolledCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Enrolled" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.enrolledCount?.toLocaleString() || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'conversionRate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Conversion" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.conversionRate ? `${Math.round(row.original.conversionRate)}%` : '-'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={statusColors} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Journey', onClick: () => (window.location.href = `/crm/journeys/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/crm/journeys/${row.original.id}?edit=true`) },
          ...(row.original.status === 'DRAFT'
            ? [{ label: 'Activate', onClick: () => console.log('Activate', row.original.id) }]
            : []),
          ...(row.original.status === 'ACTIVE'
            ? [{ label: 'Pause', onClick: () => console.log('Pause', row.original.id) }]
            : []),
          ...(row.original.status === 'PAUSED'
            ? [{ label: 'Resume', onClick: () => console.log('Resume', row.original.id) }]
            : []),
          { label: 'Duplicate', onClick: () => console.log('Duplicate', row.original.id) },
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function JourneysPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['journeys', { page, pageSize }],
    queryFn: () => journeysApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Journeys" description="Automated member engagement workflows">
        <Link href="/crm/journeys/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Journey
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search journeys..."
        filterableColumns={[{ id: 'status', title: 'Status', options: statusOptions }]}
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
    </div>
  );
}
