'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Video, Play, Eye, Clock, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { videoProgramsApi } from '@/lib/api/video.api';
import { VideoProgram } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-red-100 text-red-800',
};

const difficultyColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
  ADVANCED: 'bg-red-100 text-red-800',
};

const columns: ColumnDef<VideoProgram>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Program" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-muted">
          {row.original.thumbnailUrl ? (
            <img
              src={row.original.thumbnailUrl}
              alt={row.original.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <Play className="h-6 w-6 text-white" />
          </div>
        </div>
        <div>
          <Link href={`/video/programs/${row.original.id}`} className="font-medium hover:underline">
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
    cell: ({ row }) => (
      <StatusBadge status={row.original.isPublished ? 'PUBLISHED' : 'DRAFT'} colorMap={statusColors} />
    ),
    filterFn: (row, id, value) => {
      const status = row.original.isPublished ? 'PUBLISHED' : 'DRAFT';
      return value.includes(status);
    },
  },
  {
    accessorKey: 'difficulty',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Difficulty" />,
    cell: ({ row }) => (
      <StatusBadge status={row.original.difficulty || 'BEGINNER'} colorMap={difficultyColors} />
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => row.original.category || '-',
  },
  {
    accessorKey: 'videoCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Videos" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.videoCount || 0}</span>
      </div>
    ),
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const duration = row.original.totalDuration || 0;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'viewCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span>{(row.original.viewCount || 0).toLocaleString()}</span>
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', href: `/video/programs/${row.original.id}` },
          { label: 'Edit', href: `/video/programs/${row.original.id}/edit` },
          { label: 'Analytics', href: `/video/programs/${row.original.id}/analytics` },
          ...(row.original.isPublished
            ? [{ label: 'Unpublish', onClick: () => console.log('Unpublish', row.original.id) }]
            : [{ label: 'Publish', onClick: () => console.log('Publish', row.original.id) }]),
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

export default function VideoProgramsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['video-programs', { page, pageSize }],
    queryFn: () => videoProgramsApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Video Programs" description="Create and manage video training programs">
        <div className="flex gap-2">
          <Link href="/video/analytics">
            <Button variant="outline">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/video/programs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </Link>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search programs..."
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
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Draft', value: 'DRAFT' },
            ],
          },
          {
            column: 'difficulty',
            title: 'Difficulty',
            options: [
              { label: 'Beginner', value: 'BEGINNER' },
              { label: 'Intermediate', value: 'INTERMEDIATE' },
              { label: 'Advanced', value: 'ADVANCED' },
            ],
          },
        ]}
      />
    </div>
  );
}
