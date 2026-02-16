'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { membershipTypesApi } from '@/lib/api/memberships.api';
import { MembershipType } from '@/types';
import { formatCurrency } from '@/lib/utils';

const typeColors: Record<string, string> = {
  RECURRING: 'bg-blue-100 text-blue-800',
  CLASS_PACK: 'bg-purple-100 text-purple-800',
  DROP_IN: 'bg-green-100 text-green-800',
};

const columns: ColumnDef<MembershipType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Link href={`/memberships/${row.original.id}`} className="font-medium hover:underline">
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
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <StatusBadge status={row.original.type} colorMap={typeColors} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'price',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const price = formatCurrency(row.original.price);
      const period = row.original.billingPeriod?.toLowerCase();
      return period ? `${price}/${period}` : price;
    },
  },
  {
    accessorKey: 'classCredits',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Credits" />,
    cell: ({ row }) =>
      row.original.classCredits ? `${row.original.classCredits} classes` : 'Unlimited',
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'}
        colorMap={{ ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-800' }}
      />
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', onClick: () => (window.location.href = `/memberships/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/memberships/${row.original.id}?edit=true`) },
          { label: 'Deactivate', onClick: () => console.log('Deactivate', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

const typeOptions = [
  { label: 'Recurring', value: 'RECURRING' },
  { label: 'Class Pack', value: 'CLASS_PACK' },
  { label: 'Drop-In', value: 'DROP_IN' },
];

export default function MembershipsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['membership-types', { page, pageSize }],
    queryFn: () => membershipTypesApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Membership Types" description="Manage your membership plans and pricing">
        <Link href="/memberships/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Membership Type
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search memberships..."
        filterableColumns={[{ id: 'type', title: 'Type', options: typeOptions }]}
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
