'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Megaphone, Mail, MessageSquare, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { campaignsApi } from '@/lib/api/marketing.api';
import { Campaign } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
};

const typeIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4" />,
  SMS: <MessageSquare className="h-4 w-4" />,
  PUSH: <Bell className="h-4 w-4" />,
};

const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {typeIcons[row.original.type] || <Megaphone className="h-5 w-5 text-primary" />}
        </div>
        <div>
          <Link href={`/marketing/campaigns/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="text-sm text-muted-foreground capitalize">{row.original.type.toLowerCase()}</p>
        </div>
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
    accessorKey: 'sentCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sent" />,
    cell: ({ row }) => row.original.sentCount?.toLocaleString() || '-',
  },
  {
    accessorKey: 'openRate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Open Rate" />,
    cell: ({ row }) => (row.original.openRate ? `${Math.round(row.original.openRate)}%` : '-'),
  },
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Scheduled" />,
    cell: ({ row }) =>
      row.original.scheduledAt
        ? format(new Date(row.original.scheduledAt), 'MMM d, yyyy h:mm a')
        : '-',
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', onClick: () => (window.location.href = `/marketing/campaigns/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/marketing/campaigns/${row.original.id}?edit=true`) },
          { label: 'Duplicate', onClick: () => console.log('Duplicate', row.original.id) },
          ...(row.original.status === 'DRAFT'
            ? [{ label: 'Send Now', onClick: () => console.log('Send', row.original.id) }]
            : []),
          ...(row.original.status === 'ACTIVE'
            ? [{ label: 'Pause', onClick: () => console.log('Pause', row.original.id) }]
            : []),
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Paused', value: 'PAUSED' },
];

export default function CampaignsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { page, pageSize }],
    queryFn: () => campaignsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" description="Create and manage marketing campaigns">
        <Link href="/marketing/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search campaigns..."
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
