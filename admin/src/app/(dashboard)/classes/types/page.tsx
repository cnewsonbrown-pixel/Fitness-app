'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { classTypesApi } from '@/lib/api/classes.api';
import { ClassType } from '@/types';

const columns: ColumnDef<ClassType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: row.original.color ? `${row.original.color}20` : '#6366f120' }}
        >
          <Dumbbell
            className="h-5 w-5"
            style={{ color: row.original.color || '#6366f1' }}
          />
        </div>
        <div>
          <Link href={`/classes/types/${row.original.id}`} className="font-medium hover:underline">
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
    accessorKey: 'duration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => `${row.original.duration} min`,
  },
  {
    accessorKey: 'capacity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Capacity" />,
    cell: ({ row }) => `${row.original.capacity} spots`,
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
          { label: 'View Details', onClick: () => (window.location.href = `/classes/types/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/classes/types/${row.original.id}?edit=true`) },
          { label: 'Deactivate', onClick: () => console.log('Deactivate', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

export default function ClassTypesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['class-types', { page, pageSize }],
    queryFn: () => classTypesApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Class Types" description="Manage your class offerings">
        <Link href="/classes/types/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Class Type
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search class types..."
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
