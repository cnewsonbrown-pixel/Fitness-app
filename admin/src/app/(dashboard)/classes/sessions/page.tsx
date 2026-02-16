'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { classSessionsApi } from '@/lib/api/classes.api';
import { ClassSession } from '@/types';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const columns: ColumnDef<ClassSession>[] = [
  {
    accessorKey: 'classType.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: row.original.classType?.color ? `${row.original.classType.color}20` : '#6366f120' }}
        >
          <Calendar
            className="h-5 w-5"
            style={{ color: row.original.classType?.color || '#6366f1' }}
          />
        </div>
        <div>
          <Link href={`/classes/sessions/${row.original.id}`} className="font-medium hover:underline">
            {row.original.classType?.name || 'Unknown Class'}
          </Link>
          <p className="text-sm text-muted-foreground">
            {format(new Date(row.original.startTime), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{format(new Date(row.original.startTime), 'h:mm a')}</p>
        <p className="text-sm text-muted-foreground">
          {row.original.classType?.duration || 60} min
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'location.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.location?.name || 'Unknown'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'instructor.firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Instructor" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span>
          {row.original.instructor
            ? `${row.original.instructor.firstName} ${row.original.instructor.lastName}`
            : 'Unassigned'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'bookedCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attendance" />,
    cell: ({ row }) => {
      const booked = row.original.bookedCount || 0;
      const capacity = row.original.capacity || row.original.classType?.capacity || 0;
      const percentage = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
      return (
        <div>
          <p className="font-medium">{booked} / {capacity}</p>
          <p className="text-sm text-muted-foreground">{percentage}% full</p>
        </div>
      );
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
          { label: 'View Details', onClick: () => (window.location.href = `/classes/sessions/${row.original.id}`) },
          { label: 'Manage Roster', onClick: () => (window.location.href = `/classes/sessions/${row.original.id}?tab=roster`) },
          { label: 'Cancel Session', onClick: () => console.log('Cancel', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ClassSessionsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['class-sessions', { page, pageSize }],
    queryFn: () => classSessionsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Class Sessions" description="Manage individual class instances">
        <Link href="/classes/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="classType.name"
        searchPlaceholder="Search sessions..."
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
