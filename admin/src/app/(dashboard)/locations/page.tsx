'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { locationsApi } from '@/lib/api/locations.api';
import { Location } from '@/types';

const columns: ColumnDef<Location>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Link href={`/locations/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="text-sm text-muted-foreground">{row.original.city}, {row.original.country}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'address',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.address}</span>,
  },
  {
    accessorKey: 'timezone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timezone" />,
    cell: ({ row }) => row.original.timezone,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) =>
      row.original.isActive ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Active</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="h-4 w-4" />
          <span>Inactive</span>
        </div>
      ),
    filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', onClick: () => (window.location.href = `/locations/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/locations/${row.original.id}?edit=true`) },
          { label: 'Deactivate', onClick: () => console.log('Deactivate', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

export default function LocationsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['locations', { page, pageSize }],
    queryFn: () => locationsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Locations" description="Manage your gym locations">
        <Link href="/locations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search locations..."
        filterableColumns={[
          { id: 'isActive', title: 'Status', options: statusOptions },
        ]}
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
