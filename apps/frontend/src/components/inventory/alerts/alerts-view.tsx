'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Package, Clock, Ban, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { InventoryAlertsData } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';

interface AlertsViewProps {
  data?: InventoryAlertsData;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

function AlertCard({ icon, title, count, children, emptyMessage, variant }: {
  icon: React.ReactNode; title: string; count: number; children: React.ReactNode; emptyMessage: string; variant?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <Badge variant={(variant as 'danger' | 'warning' | 'info' | 'secondary') ?? 'danger'}>{count}</Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {count === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function AlertsView({ data, isLoading, isError, onRefresh }: AlertsViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground">Failed to load alerts</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-1" />Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AlertCard icon={<Ban className="h-4 w-4 text-destructive" />} title="Out of Stock" count={data.totalOutOfStock} emptyMessage="All products are in stock" variant="danger">
          <div className="space-y-1">
            {data.outOfStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <Link href={`/inventory/products/${p.id}`} className="hover:underline">{p.name}</Link>
                <span className="text-destructive">0 {p.unit}</span>
              </div>
            ))}
          </div>
        </AlertCard>

        <AlertCard icon={<AlertTriangle className="h-4 w-4 text-warning" />} title="Low Stock" count={data.totalLowStock} emptyMessage="All inventory levels are healthy" variant="warning">
          <div className="space-y-1">
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <Link href={`/inventory/products/${p.id}`} className="hover:underline">{p.name}</Link>
                <span className="text-warning font-medium">{p.currentStock} {p.unit}</span>
              </div>
            ))}
          </div>
        </AlertCard>

        <AlertCard icon={<Clock className="h-4 w-4 text-info" />} title="Expiring Soon (7 days)" count={data.totalExpiringSoon} emptyMessage="No products expiring soon" variant="info">
          <div className="space-y-1">
            {data.expiringSoon.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <Link href={`/inventory/products/${p.ingredientId}`} className="hover:underline">{p.ingredientName}</Link>
                <span className="text-info">{p.quantity} {p.unit} ({p.daysUntilExpiry}d)</span>
              </div>
            ))}
          </div>
        </AlertCard>

        <AlertCard icon={<Package className="h-4 w-4 text-secondary" />} title="Pending Receiving" count={data.totalPendingReceiving} emptyMessage="No pending receipts" variant="secondary">
          <div className="space-y-1">
            {data.pendingReceiving.map((po) => (
              <div key={po.id} className="flex justify-between text-sm py-1">
                <div>
                  <Link href={`/inventory/purchase-orders/${po.id}`} className="hover:underline">{po.supplierName}</Link>
                  <Badge variant="secondary" className="ml-2">{po.itemCount} items</Badge>
                </div>
                <div className="text-right">
                  <div>{formatCurrency(po.totalAmount)}</div>
                  <div className="text-xs text-muted-foreground">{po.expectedDeliveryAt ? new Date(po.expectedDeliveryAt).toLocaleDateString() : 'No date'}</div>
                </div>
              </div>
            ))}
          </div>
        </AlertCard>
      </div>

      {data.expired.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Expired Products ({data.totalExpired})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-1">
              {data.expired.map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1">
                  <div>
                    <Link href={`/inventory/products/${p.ingredientId}`} className="hover:underline">{p.ingredientName}</Link>
                    {p.batchCode && <Badge variant="secondary" className="ml-2">Batch: {p.batchCode}</Badge>}
                  </div>
                  <span className="text-destructive">{p.quantity} {p.unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
