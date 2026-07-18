'use client';

import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { Supplier } from '@/lib/inventory-types';

interface SupplierListProps {
  data: Supplier[];
  loading?: boolean;
  error?: string | null;
}

export function SupplierList({ data, loading, error }: SupplierListProps) {
  const router = useRouter();

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/inventory/suppliers/${row.original.id}`)}
          className="font-medium hover:underline text-left"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'contactName',
      header: 'Contact',
      cell: ({ row }) => row.original.contactName ?? '—',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Active' ? 'success' : row.original.status === 'Inactive' ? 'secondary' : 'danger'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'leadTimeDays',
      header: 'Lead Time',
      cell: ({ row }) => `${row.original.leadTimeDays} days`,
    },
    {
      accessorKey: 'productCount',
      header: 'Products',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      searchable
      emptyMessage="No suppliers found."
    />
  );
}
