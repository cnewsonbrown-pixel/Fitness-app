'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { UserPlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { leadsApi, Lead } from '@/lib/api/marketing.api';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-purple-100 text-purple-800',
  CONVERTED: 'bg-green-100 text-green-800',
  LOST: 'bg-gray-100 text-gray-800',
};

export default function LeadsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { page, pageSize }],
    queryFn: () => leadsApi.list({ page: page + 1, limit: pageSize }),
  });

  const convertMutation = useMutation({
    mutationFn: (leadId: string) => leadsApi.convert(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead converted to member');
    },
    onError: () => {
      toast.error('Failed to convert lead');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lead" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.firstName || row.original.lastName
              ? `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim()
              : 'Unknown'}
          </p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => row.original.source || '-',
    },
    {
      accessorKey: 'score',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(row.original.score, 100)}%` }}
            />
          </div>
          <span className="text-sm">{row.original.score}</span>
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
            ...(row.original.status !== 'CONVERTED'
              ? [
                  {
                    label: 'Convert to Member',
                    onClick: () => convertMutation.mutate(row.original.id),
                  },
                ]
              : []),
            ...(row.original.status === 'NEW'
              ? [
                  {
                    label: 'Mark as Contacted',
                    onClick: () =>
                      updateStatusMutation.mutate({ id: row.original.id, status: 'CONTACTED' }),
                  },
                ]
              : []),
            ...(row.original.status === 'CONTACTED'
              ? [
                  {
                    label: 'Mark as Qualified',
                    onClick: () =>
                      updateStatusMutation.mutate({ id: row.original.id, status: 'QUALIFIED' }),
                  },
                ]
              : []),
            ...(row.original.status !== 'LOST' && row.original.status !== 'CONVERTED'
              ? [
                  {
                    label: 'Mark as Lost',
                    onClick: () =>
                      updateStatusMutation.mutate({ id: row.original.id, status: 'LOST' }),
                    variant: 'destructive' as const,
                    separator: true,
                  },
                ]
              : []),
            ...(row.original.memberId
              ? [
                  {
                    label: 'View Member',
                    onClick: () => (window.location.href = `/members/${row.original.memberId}`),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const statusOptions = [
    { label: 'New', value: 'NEW' },
    { label: 'Contacted', value: 'CONTACTED' },
    { label: 'Qualified', value: 'QUALIFIED' },
    { label: 'Converted', value: 'CONVERTED' },
    { label: 'Lost', value: 'LOST' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description="Manage and convert leads to members">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserPlus className="h-4 w-4" />
          <span>{data?.pagination.total || 0} total leads</span>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="email"
        searchPlaceholder="Search leads..."
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
