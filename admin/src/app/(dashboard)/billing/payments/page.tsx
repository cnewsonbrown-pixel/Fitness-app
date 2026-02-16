'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { billingApi } from '@/lib/api/billing.api';
import { Payment } from '@/types';
import { formatCurrency } from '@/lib/utils';

const statusColors: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'member.firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <MemberAvatar
          firstName={row.original.member?.firstName || ''}
          lastName={row.original.member?.lastName || ''}
          avatarUrl={row.original.member?.avatarUrl}
        />
        <div>
          <Link href={`/members/${row.original.member?.id}`} className="font-medium hover:underline">
            {row.original.member?.firstName} {row.original.member?.lastName}
          </Link>
          <p className="text-sm text-muted-foreground">{row.original.member?.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.description}</p>
        <p className="text-sm text-muted-foreground">{row.original.paymentMethod}</p>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy h:mm a'),
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
          { label: 'View Details', onClick: () => console.log('View', row.original.id) },
          { label: 'View Member', onClick: () => (window.location.href = `/members/${row.original.member?.id}`) },
          ...(row.original.status === 'SUCCEEDED'
            ? [{ label: 'Refund', onClick: () => console.log('Refund', row.original.id), variant: 'destructive' as const, separator: true }]
            : []),
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Succeeded', value: 'SUCCEEDED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

export default function PaymentsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['billing', 'payments', { page, pageSize }],
    queryFn: () => billingApi.listPayments({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="View and manage all payment transactions">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>{data?.pagination.total || 0} total payments</span>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="member.firstName"
        searchPlaceholder="Search payments..."
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
