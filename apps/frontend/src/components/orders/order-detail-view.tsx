'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, CreditCard, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { OrderStatusBadge } from './order-status-badge';
import type { SalesOrder } from '@/lib/sales-types';
import { ORDER_SOURCE_LABELS, formatCurrency, PAYMENT_STATUS_LABELS } from '@/lib/sales-types';

interface OrderDetailViewProps {
  order: SalesOrder | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  onSubmit: () => void;
  onPay: () => void;
  onCancel: (reason: string) => void;
}

export function OrderDetailView({
  order,
  isLoading,
  isError,
  error,
  onRetry,
  onSubmit,
  onPay,
  onCancel,
}: OrderDetailViewProps) {
  const router = useRouter();
  const [cancelReason] = useState('');

  if (isLoading) {
    return <LoadingState message={t("Loading order...")} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("Failed to load order")}
        message={error?.message ?? t('An unexpected error occurred')}
        onRetry={onRetry}
      />
    );
  }

  if (!order) {
    return (
      <ErrorState
        title={t("Order not found")}
        message={t("The requested order could not be found.")}
        onRetry={onRetry}
      />
    );
  }

  const isDraft = order.status === 'draft';
  const isPaid = order.paymentStatus === 'paid';
  const canSubmit = isDraft && order.items.length > 0;
  const canPay = (order.status === 'submitted' || order.status === 'in_progress' || order.status === 'ready') && !isPaid;
  const canCancel = order.status !== 'completed' && order.status !== 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label={t("Go back")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Created {date}', { date: new Date(order.createdAt).toLocaleString() })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.menuItemName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                      {item.modifiers.length > 0 && ` — ${item.modifiers.join(', ')}`}
                    </div>
                  </div>
                  <div className="font-medium">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('Subtotal')}</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('Tax (8%)')}</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Discount')}</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>{t('Total')}</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-muted-foreground">{t('Payment')}</span>
                <span>{t(PAYMENT_STATUS_LABELS[order.paymentStatus])}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Source')}</span>
                <span>{t(ORDER_SOURCE_LABELS[order.source])}</span>
              </div>
              {order.tableId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Table')}</span>
                  <span>{order.tableId}</span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Customer')}</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              {order.customerCount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Guests')}</span>
                  <span>{order.customerCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Items')}</span>
                <span>{order.items.length}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            {canSubmit && (
              <Button onClick={onSubmit} className="w-full">
                 <Send className="h-4 w-4 mr-2" />
                 {t('Submit to Kitchen')}
               </Button>
            )}
            {canPay && (
              <Button onClick={onPay} className="w-full" variant="primary">
                 <CreditCard className="h-4 w-4 mr-2" />
                 {t('Process Payment')}
               </Button>
            )}
            {canCancel && (
              <Button
                onClick={() => onCancel(cancelReason || 'Cancelled')}
                variant="outline"
                className="w-full text-destructive"
              >
                 <Trash2 className="h-4 w-4 mr-2" />
                 {t('Cancel Order')}
               </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
