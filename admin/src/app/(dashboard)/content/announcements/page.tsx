'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { announcementsApi } from '@/lib/api/content.api';
import { Announcement } from '@/types';

const typeColors: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-800',
  URGENT: 'bg-red-100 text-red-800',
};

const typeIcons: Record<string, React.ReactNode> = {
  INFO: <Info className="h-4 w-4" />,
  WARNING: <AlertTriangle className="h-4 w-4" />,
  SUCCESS: <CheckCircle className="h-4 w-4" />,
  URGENT: <AlertCircle className="h-4 w-4" />,
};

const columns: ColumnDef<Announcement>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Announcement" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            row.original.type === 'URGENT'
              ? 'bg-red-100 text-red-600'
              : row.original.type === 'WARNING'
              ? 'bg-yellow-100 text-yellow-600'
              : row.original.type === 'SUCCESS'
              ? 'bg-green-100 text-green-600'
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          {typeIcons[row.original.type] || <Bell className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{row.original.content}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <StatusBadge status={row.original.type} colorMap={typeColors} />,
  },
  {
    accessorKey: 'targetAudience',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Audience" />,
    cell: ({ row }) => row.original.targetAudience || 'All',
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active Period" />,
    cell: ({ row }) => {
      const start = row.original.startDate;
      const end = row.original.endDate;
      if (!start && !end) return 'Always';
      if (start && end) {
        return `${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d')}`;
      }
      if (start) return `From ${format(new Date(start), 'MMM d')}`;
      if (end) return `Until ${format(new Date(end), 'MMM d')}`;
    },
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
          { label: 'Edit', onClick: () => console.log('Edit', row.original.id) },
          ...(row.original.isActive
            ? [{ label: 'Deactivate', onClick: () => console.log('Deactivate', row.original.id) }]
            : [{ label: 'Activate', onClick: () => console.log('Activate', row.original.id) }]),
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

export default function AnnouncementsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', { page, pageSize }],
    queryFn: () => announcementsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Create and manage announcements for members and staff">
        <Link href="/content/announcements/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="title"
        searchPlaceholder="Search announcements..."
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
