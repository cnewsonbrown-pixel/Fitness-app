'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { billingApi, Subscription } from '@/lib/api/billing.api';
import { formatCurrency } from '@/lib/utils';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  PAST_DUE: 'bg-red-100 text-red-800',
};

const columns: ColumnDef<Subscription>[] = [
  {
    accessorKey: 'memberId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => (
      <Link href={`/billing/${row.original.memberId}`} className="font-medium hover:underline">
        View Member
      </Link>
    ),
  },
  {
    accessorKey: 'membershipTypeName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Membership" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.membershipTypeName}</p>
        <p className="text-sm text-muted-foreground capitalize">{row.original.interval.toLowerCase()}</p>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.original.amount)}/{row.original.interval.toLowerCase().slice(0, -2)}
      </span>
    ),
  },
  {
    accessorKey: 'currentPeriodEnd',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Next Billing" />,
    cell: ({ row }) => {
      if (row.original.cancelAtPeriodEnd) {
        return <span className="text-muted-foreground">Cancels {format(new Date(row.original.currentPeriodEnd), 'MMM d')}</span>;
      }
      return format(new Date(row.original.currentPeriodEnd), 'MMM d, yyyy');
    },
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
          { label: 'View Details', onClick: () => (window.location.href = `/billing/${row.original.memberId}`) },
          ...(row.original.status === 'ACTIVE'
            ? [
                { label: 'Pause', onClick: () => console.log('Pause', row.original.id) },
                { label: 'Cancel', onClick: () => console.log('Cancel', row.original.id), variant: 'destructive' as const, separator: true },
              ]
            : []),
          ...(row.original.status === 'PAUSED'
            ? [{ label: 'Resume', onClick: () => console.log('Resume', row.original.id) }]
            : []),
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Past Due', value: 'PAST_DUE' },
];

export default function SubscriptionsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['billing', 'subscriptions', { page, pageSize }],
    queryFn: () => billingApi.listSubscriptions({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Manage recurring memberships">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>{data?.pagination.total || 0} subscriptions</span>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="membershipTypeName"
        searchPlaceholder="Search subscriptions..."
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
