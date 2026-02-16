'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { segmentsApi } from '@/lib/api/crm.api';
import { Segment } from '@/types';

const columns: ColumnDef<Segment>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Segment" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Link href={`/crm/segments/${row.original.id}`} className="font-medium hover:underline">
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
    accessorKey: 'memberCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Members" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.memberCount?.toLocaleString() || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => format(new Date(row.original.updatedAt), 'MMM d, yyyy h:mm a'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Segment', onClick: () => (window.location.href = `/crm/segments/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/crm/segments/${row.original.id}?edit=true`) },
          { label: 'Refresh Count', onClick: () => console.log('Refresh', row.original.id) },
          { label: 'Duplicate', onClick: () => console.log('Duplicate', row.original.id) },
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

export default function SegmentsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['segments', { page, pageSize }],
    queryFn: () => segmentsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Segments" description="Create targeted member groups">
        <Link href="/crm/segments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search segments..."
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
