'use client';

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
      header: 'Product',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <span className={row.original.isIncrease ? 'text-success' : row.original.isDecrease ? 'text-destructive' : ''}>
          {row.original.isIncrease ? '+' : row.original.isDecrease ? '-' : ''}{row.original.quantity} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => row.original.reason ?? '—',
    },
    {
      accessorKey: 'performedBy',
      header: 'By',
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
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
      emptyMessage="No stock movements recorded."
    />
  );
}
