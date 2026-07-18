'use client';

import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Archive, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Product } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';

interface ProductListProps {
  data: Product[];
  loading?: boolean;
  error?: string | null;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function ProductList({ data, loading, error, onArchive, onRestore }: ProductListProps) {
  const router = useRouter();

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/inventory/products/${row.original.id}`)}
          className="font-medium hover:underline text-left"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
    },
    {
      accessorKey: 'currentStock',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={row.original.currentStock <= 10 ? 'text-destructive font-medium' : ''}>
          {row.original.currentStock} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: 'costPerUnit',
      header: 'Cost/Unit',
      cell: ({ row }) => formatCurrency(row.original.costPerUnit),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/inventory/products/${row.original.id}`)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/inventory/products/${row.original.id}/edit`)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.isActive ? (
              <DropdownMenuItem onClick={() => onArchive(row.original.id)}>
                <Archive className="h-4 w-4 mr-2" /> Archive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onRestore(row.original.id)}>
                <RotateCcw className="h-4 w-4 mr-2" /> Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      searchable
      emptyMessage="No products found. Create your first product to get started."
    />
  );
}
