'use client';
import { t } from '@/lib/i18n';

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
      header: t('Name'),
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
      header: t('Contact'),
      cell: ({ row }) => row.original.contactName ?? '—',
    },
    {
      accessorKey: 'email',
      header: t('Email'),
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      accessorKey: 'phone',
      header: t('Phone'),
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Active' ? 'success' : row.original.status === 'Inactive' ? 'secondary' : 'danger'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'leadTimeDays',
      header: t('Lead Time'),
      cell: ({ row }) => `${row.original.leadTimeDays} ${t('days')}`,
    },
    {
      accessorKey: 'productCount',
      header: t('Products'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      searchable
      emptyMessage={t('No suppliers found.')}
    />
  );
}
