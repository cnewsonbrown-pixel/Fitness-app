'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { membersApi } from '@/lib/api/members.api';
import { Member } from '@/types';
import { LIFECYCLE_STAGE_COLORS } from '@/config/constants';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<Member>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <MemberAvatar
          firstName={row.original.firstName}
          lastName={row.original.lastName}
          avatarUrl={row.original.avatarUrl}
          className="h-8 w-8"
        />
        <div>
          <Link
            href={`/members/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.firstName} {row.original.lastName}
          </Link>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'lifecycleStage',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <StatusBadge status={row.original.lifecycleStage} colorMap={LIFECYCLE_STAGE_COLORS} />
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'pointBalance',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Points" />,
    cell: ({ row }) => <span>{row.original.pointBalance.toLocaleString()}</span>,
  },
  {
    accessorKey: 'currentStreak',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Streak" />,
    cell: ({ row }) => <span>{row.original.currentStreak} days</span>,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', onClick: () => (window.location.href = `/members/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/members/${row.original.id}?edit=true`) },
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

const lifecycleOptions = [
  { label: 'Lead', value: 'LEAD' },
  { label: 'Trial', value: 'TRIAL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'At Risk', value: 'AT_RISK' },
  { label: 'Churned', value: 'CHURNED' },
  { label: 'Paused', value: 'PAUSED' },
];

export default function MembersPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['members', { page, pageSize }],
    queryFn: () => membersApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Members" description="Manage your gym members">
        <Link href="/members/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search members..."
        filterableColumns={[
          { id: 'lifecycleStage', title: 'Status', options: lifecycleOptions },
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
