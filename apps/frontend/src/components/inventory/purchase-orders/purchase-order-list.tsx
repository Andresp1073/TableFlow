'use client';

import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/inventory/shared/status-badge';
import type { PurchaseOrder } from '@/lib/inventory-types';
import { formatCurrency, getStatusColor } from '@/lib/inventory-types';

interface PurchaseOrderListProps {
  data: PurchaseOrder[];
  loading?: boolean;
  error?: string | null;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
}

export function PurchaseOrderList({ data, loading, error, onSubmit, onApprove, onCancel }: PurchaseOrderListProps) {
  const router = useRouter();

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: 'id',
      header: 'Order #',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/inventory/purchase-orders/${row.original.id}`)}
          className="font-mono text-xs hover:underline text-left"
        >
          {row.original.id.slice(-8)}
        </button>
      ),
    },
    {
      accessorKey: 'supplierName',
      header: 'Supplier',
      cell: ({ row }) => (
        <button onClick={() => router.push(`/inventory/purchase-orders/${row.original.id}`)} className="font-medium hover:underline text-left">
          {row.original.supplierName}
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'itemCount',
      header: 'Items',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: 'receivedCount',
      header: 'Received',
      cell: ({ row }) => `${row.original.receivedCount}/${row.original.itemCount}`,
    },
    {
      accessorKey: 'expectedDeliveryAt',
      header: 'Expected Delivery',
      cell: ({ row }) => row.original.expectedDeliveryAt ? new Date(row.original.expectedDeliveryAt).toLocaleDateString() : '—',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const po = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/inventory/purchase-orders/${po.id}`)}>View Details</DropdownMenuItem>
              {po.status === 'Draft' && (
                <DropdownMenuItem onClick={() => onSubmit(po.id)}>Submit</DropdownMenuItem>
              )}
              {po.status === 'Submitted' && (
                <DropdownMenuItem onClick={() => onApprove(po.id)}>Approve</DropdownMenuItem>
              )}
              {(po.status === 'Draft' || po.status === 'Submitted' || po.status === 'Approved') && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/inventory/receiving?orderId=${po.id}`)}>Receive</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancel(po.id)} className="text-destructive">Cancel</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      searchable
      emptyMessage="No purchase orders found."
    />
  );
}
