'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Video, Play, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { videosApi } from '@/lib/api/video.api';
import { Video as VideoType } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
};

const columns: ColumnDef<VideoType>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Video" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-20 overflow-hidden rounded bg-muted">
          {row.original.thumbnailUrl ? (
            <img
              src={row.original.thumbnailUrl}
              alt={row.original.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Play className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {row.original.duration && (
            <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
              {Math.floor(row.original.duration / 60)}:{(row.original.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
        <div>
          <Link href={`/video/videos/${row.original.id}`} className="font-medium hover:underline">
            {row.original.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'programName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Program" />,
    cell: ({ row }) => row.original.programName || 'Standalone',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <StatusBadge status={row.original.isPublished ? 'PUBLISHED' : 'DRAFT'} colorMap={statusColors} />
    ),
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const duration = row.original.duration || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
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
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View Details', href: `/video/videos/${row.original.id}` },
          { label: 'Edit', href: `/video/videos/${row.original.id}/edit` },
          { label: 'Analytics', href: `/video/videos/${row.original.id}/analytics` },
          ...(row.original.isPublished
            ? [{ label: 'Unpublish', onClick: () => console.log('Unpublish', row.original.id) }]
            : [{ label: 'Publish', onClick: () => console.log('Publish', row.original.id) }]),
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

export default function VideosPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['videos', { page, pageSize }],
    queryFn: () => videosApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Videos" description="Manage your video library">
        <Link href="/video/videos/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="title"
        searchPlaceholder="Search videos..."
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
