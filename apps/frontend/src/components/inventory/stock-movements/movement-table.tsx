'use client';
import { t } from '@/lib/i18n';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { MovementTypeBadge } from '@/components/inventory/shared/status-badge';
import type { StockMovement } from '@/lib/inventory-types';

interface MovementTableProps {
  data: StockMovement[];
  loading?: boolean;
  error?: string | null;
}

export function MovementTable({ data, loading, error }: MovementTableProps) {
  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: 'ingredientName',
      header: t('Product'),
    },
    {
      accessorKey: 'type',
      header: t('Type'),
      cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'quantity',
      header: t('Quantity'),
      cell: ({ row }) => (
        <span className={row.original.isIncrease ? 'text-success' : row.original.isDecrease ? 'text-destructive' : ''}>
          {row.original.isIncrease ? '+' : row.original.isDecrease ? '-' : ''}{row.original.quantity} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: t('Reason'),
      cell: ({ row }) => row.original.reason ?? '—',
    },
    {
      accessorKey: 'performedBy',
      header: t('By'),
    },
    {
      accessorKey: 'createdAt',
      header: t('Date'),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      searchable
      emptyMessage={t('No stock movements recorded.')}
    />
  );
}
