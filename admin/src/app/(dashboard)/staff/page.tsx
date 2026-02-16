'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { staffApi } from '@/lib/api/staff.api';
import { Staff } from '@/types';
import { formatCurrency } from '@/lib/utils';

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  INSTRUCTOR: 'bg-green-100 text-green-800',
  FRONT_DESK: 'bg-yellow-100 text-yellow-800',
};

const columns: ColumnDef<Staff>[] = [
  {
    accessorKey: 'user.firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={row.original.user?.avatarUrl} />
          <AvatarFallback>
            {row.original.user?.firstName?.[0]}
            {row.original.user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/staff/${row.original.id}`} className="font-medium hover:underline">
            {row.original.user?.firstName} {row.original.user?.lastName}
          </Link>
          <p className="text-sm text-muted-foreground">{row.original.user?.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <StatusBadge status={row.original.role} colorMap={roleColors} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'specialties',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Specialties" />,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.specialties?.slice(0, 2).map((specialty) => (
          <Badge key={specialty} variant="secondary" className="text-xs">
            {specialty}
          </Badge>
        ))}
        {row.original.specialties && row.original.specialties.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{row.original.specialties.length - 2}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'hourlyRate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
    cell: ({ row }) =>
      row.original.hourlyRate ? `${formatCurrency(row.original.hourlyRate)}/hr` : '-',
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
          { label: 'View Profile', onClick: () => (window.location.href = `/staff/${row.original.id}`) },
          { label: 'Edit', onClick: () => (window.location.href = `/staff/${row.original.id}?edit=true`) },
          { label: 'View Schedule', onClick: () => (window.location.href = `/staff/${row.original.id}?tab=schedule`) },
          { label: 'Deactivate', onClick: () => console.log('Deactivate', row.original.id), variant: 'destructive', separator: true },
        ]}
      />
    ),
  },
];

const roleOptions = [
  { label: 'Owner', value: 'OWNER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Instructor', value: 'INSTRUCTOR' },
  { label: 'Front Desk', value: 'FRONT_DESK' },
];

export default function StaffPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['staff', { page, pageSize }],
    queryFn: () => staffApi.list({ page: page + 1, limit: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description="Manage your team members">
        <Link href="/staff/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="user.firstName"
        searchPlaceholder="Search staff..."
        filterableColumns={[{ id: 'role', title: 'Role', options: roleOptions }]}
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
