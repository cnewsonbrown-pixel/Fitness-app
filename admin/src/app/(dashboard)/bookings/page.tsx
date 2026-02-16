'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { CalendarCheck, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { bookingsApi } from '@/lib/api/bookings.api';
import { Booking } from '@/types';

const statusColors: Record<string, string> = {
  BOOKED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const columns: ColumnDef<Booking>[] = [
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
    accessorKey: 'classSession.classType.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: row.original.classSession?.classType?.color
              ? `${row.original.classSession.classType.color}20`
              : '#6366f120',
          }}
        >
          <Calendar
            className="h-5 w-5"
            style={{ color: row.original.classSession?.classType?.color || '#6366f1' }}
          />
        </div>
        <div>
          <Link
            href={`/classes/sessions/${row.original.classSession?.id}`}
            className="font-medium hover:underline"
          >
            {row.original.classSession?.classType?.name || 'Unknown Class'}
          </Link>
          <p className="text-sm text-muted-foreground">
            {row.original.classSession?.location?.name || 'Unknown Location'}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'classSession.startTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date & Time" />,
    cell: ({ row }) => {
      if (!row.original.classSession?.startTime) return 'Unknown';
      const date = new Date(row.original.classSession.startTime);
      return (
        <div>
          <p className="font-medium">{format(date, 'MMM d, yyyy')}</p>
          <p className="text-sm text-muted-foreground">{format(date, 'h:mm a')}</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'bookedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Booked" />,
    cell: ({ row }) => {
      if (!row.original.bookedAt) return 'Unknown';
      return (
        <p className="text-sm text-muted-foreground">
          {format(new Date(row.original.bookedAt), 'MMM d, h:mm a')}
        </p>
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
          { label: 'View Details', onClick: () => (window.location.href = `/bookings/${row.original.id}`) },
          { label: 'View Member', onClick: () => (window.location.href = `/members/${row.original.member?.id}`) },
          { label: 'View Session', onClick: () => (window.location.href = `/classes/sessions/${row.original.classSession?.id}`) },
          { label: 'Cancel Booking', onClick: () => console.log('Cancel', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Checked In', value: 'CHECKED_IN' },
  { label: 'No Show', value: 'NO_SHOW' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function BookingsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', { page, pageSize }],
    queryFn: () => bookingsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="View and manage class bookings">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarCheck className="h-4 w-4" />
          <span>{data?.pagination.total || 0} total bookings</span>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="member.firstName"
        searchPlaceholder="Search bookings..."
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
