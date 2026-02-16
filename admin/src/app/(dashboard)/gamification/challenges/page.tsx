'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Target, Users, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { challengesApi } from '@/lib/api/gamification.api';
import { Challenge } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const columns: ColumnDef<Challenge>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Challenge" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <Link href={`/gamification/challenges/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
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
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="capitalize">{row.original.type?.toLowerCase().replace('_', ' ') || 'General'}</span>
    ),
  },
  {
    accessorKey: 'participantCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Participants" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.participantCount || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'completedCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Completed" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.completedCount || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'pointsReward',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reward" />,
    cell: ({ row }) => (
      <span className="font-medium text-primary">{row.original.pointsReward?.toLocaleString() || 0} pts</span>
    ),
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const start = row.original.startDate;
      const end = row.original.endDate;
      if (!start) return '-';
      return (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(start), 'MMM d')} - {end ? format(new Date(end), 'MMM d') : 'Ongoing'}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', href: `/gamification/challenges/${row.original.id}` },
          { label: 'Edit', href: `/gamification/challenges/${row.original.id}/edit` },
          ...(row.original.status === 'DRAFT'
            ? [{ label: 'Activate', onClick: () => console.log('Activate', row.original.id) }]
            : []),
          ...(row.original.status === 'ACTIVE'
            ? [{ label: 'Complete', onClick: () => console.log('Complete', row.original.id) }]
            : []),
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

export default function ChallengesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['challenges', { page, pageSize }],
    queryFn: () => challengesApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Challenges" description="Create and manage member challenges and competitions">
        <Link href="/gamification/challenges/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Challenge
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search challenges..."
        isLoading={isLoading}
        pageCount={data?.pagination.totalPages ?? 0}
        pageIndex={page}
        pageSize={pageSize}
        onPaginationChange={(newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        }}
        manualPagination
        facetedFilters={[
          {
            column: 'status',
            title: 'Status',
            options: [
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ],
          },
        ]}
      />
    </div>
  );
}
