'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { OrderStatusBadge } from './order-status-badge';
import type { SalesOrder } from '@/lib/sales-types';
import { ORDER_SOURCE_LABELS, formatCurrency } from '@/lib/sales-types';

interface OrderListProps {
  orders: SalesOrder[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function OrderList({ orders, isLoading, isError, error, onRetry }: OrderListProps) {
  const router = useRouter();

  if (isLoading) {
    return <LoadingState message={t("Loading orders...")} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("Failed to load orders")}
        message={error?.message ?? 'An unexpected error occurred'}
        onRetry={onRetry}
      />
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-8 w-8" />}
        title={t("No orders found")}
        description={t("Create your first order to get started.")}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <Card
          key={order.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => router.push(`/orders/${order.id}`)}
          role="article"
          aria-label={`Order ${order.id.slice(0, 8)}`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono">
                #{order.id.slice(0, 8)}
              </CardTitle>
              <OrderStatusBadge status={order.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>{t(ORDER_SOURCE_LABELS[order.source])}</span>
              </div>
              {order.tableId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Table</span>
                  <span>{order.tableId}</span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{order.items.length}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'secondary'} className="text-xs">
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
