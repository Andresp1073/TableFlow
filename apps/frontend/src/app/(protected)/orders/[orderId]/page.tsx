'use client';

import { useParams } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useOrder, useCancelOrder } from '@/hooks/use-orders';
import { useSubmitOrder, useProcessPayment } from '@/hooks/use-checkout';
import { OrderDetailView } from '@/components/orders/order-detail-view';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PaymentForm } from '@/components/pos/payment-form';
import { useState } from 'react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params['orderId'] as string;
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [showPayment, setShowPayment] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrder(restaurantId, orderId);

  const cancelOrder = useCancelOrder();
  const submitOrder = useSubmitOrder();
  const processPayment = useProcessPayment();

  async function handleSubmit() {
    try {
      await submitOrder.mutateAsync({
        restaurantId,
        orderId,
        data: { kitchenId: 'kitchen-1' },
      });
      refetch();
    } catch {
      // handled by mutation
    }
  }

  async function handleCancel(reason: string) {
    try {
      await cancelOrder.mutateAsync({ restaurantId, orderId, reason });
      refetch();
    } catch {
      // handled by mutation
    }
  }

  async function handleProcessPayment(data: { providerId: string; methodType: string; tipAmount?: number }) {
    try {
      await processPayment.mutateAsync({
        restaurantId,
        orderId,
        data,
      });
      refetch();
    } catch {
      // handled by mutation
    }
  }

  return (
    <>
      <OrderDetailView
        order={order}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onSubmit={handleSubmit}
        onPay={() => setShowPayment(true)}
        onCancel={handleCancel}
      />

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>Process payment for this order</DialogDescription>
          <PaymentForm
            total={order?.total ?? 0}
            isProcessing={processPayment.isPending}
            onProcessPayment={handleProcessPayment}
            paymentResult={processPayment.data ?? null}
            onClose={() => {
              setShowPayment(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
