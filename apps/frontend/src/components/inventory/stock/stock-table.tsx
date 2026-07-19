'use client';
import { t } from '@/lib/i18n';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { StockSummary } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';

interface StockTableProps {
  data: StockSummary[];
  loading?: boolean;
  error?: string | null;
}

export function StockTable({ data, loading, error }: StockTableProps) {
  const columns: ColumnDef<StockSummary>[] = [
    {
      accessorKey: 'name',
      header: t('Product'),
    },
    {
      accessorKey: 'category',
      header: t('Category'),
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    {
      accessorKey: 'currentStock',
      header: t('Current'),
      cell: ({ row }) => (
        <span className={row.original.isLowStock ? 'text-destructive font-medium' : ''}>
          {row.original.currentStock}
        </span>
      ),
    },
    {
      accessorKey: 'reservedStock',
      header: t('Reserved'),
    },
    {
      accessorKey: 'availableStock',
      header: t('Available'),
      cell: ({ row }) => (
        <span className={row.original.availableStock <= 0 ? 'text-destructive font-medium' : 'text-success font-medium'}>
          {row.original.availableStock}
        </span>
      ),
    },
    {
      accessorKey: 'minimumStock',
      header: t('Min'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.minimumStock}</span>,
    },
    {
      accessorKey: 'maximumStock',
      header: t('Max'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.maximumStock}</span>,
    },
    {
      id: 'status',
      header: t('Status'),
      cell: ({ row }) => {
        if (row.original.isLowStock) return <Badge variant="danger">{t('Low Stock')}</Badge>;
        if (row.original.isOverstock) return <Badge variant="warning">{t('Overstock')}</Badge>;
        return <Badge variant="success">{t('OK')}</Badge>;
      },
    },
    {
      accessorKey: 'totalValue',
      header: t('Total Value'),
      cell: ({ row }) => formatCurrency(row.original.totalValue),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      searchable
      emptyMessage={t('No stock data available.')}
    />
  );
}
