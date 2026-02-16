'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { articlesApi } from '@/lib/api/content.api';
import { Article } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-yellow-100 text-yellow-800',
};

const columns: ColumnDef<Article>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Article" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.coverImageUrl ? (
          <img
            src={row.original.coverImageUrl}
            alt=""
            className="h-12 w-16 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <Link href={`/content/articles/${row.original.id}`} className="font-medium hover:underline">
            {row.original.title}
          </Link>
          {row.original.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.excerpt}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => row.original.category || '-',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={statusColors} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'publishedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />,
    cell: ({ row }) =>
      row.original.publishedAt
        ? format(new Date(row.original.publishedAt), 'MMM d, yyyy')
        : '-',
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: 'View', onClick: () => (window.location.href = `/content/articles/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/content/articles/${row.original.id}?edit=true`) },
          ...(row.original.status === 'DRAFT'
            ? [{ label: 'Publish', onClick: () => console.log('Publish', row.original.id) }]
            : []),
          ...(row.original.status === 'PUBLISHED'
            ? [{ label: 'Unpublish', onClick: () => console.log('Unpublish', row.original.id) }]
            : []),
          { label: 'Delete', onClick: () => console.log('Delete', row.original.id), variant: 'destructive' as const, separator: true },
        ]}
      />
    ),
  },
];

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export default function ArticlesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', { page, pageSize }],
    queryFn: () => articlesApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Articles" description="Create and manage content for your members">
        <Link href="/content/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Article
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="title"
        searchPlaceholder="Search articles..."
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
