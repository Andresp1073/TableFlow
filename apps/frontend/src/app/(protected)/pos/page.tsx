'use client';
import { t } from '@/lib/i18n';

import { useState, useCallback } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCreateOrder, useAddOrderItem, useRemoveOrderItem } from '@/hooks/use-orders';
import { useSubmitOrder, useProcessPayment } from '@/hooks/use-checkout';
import { PosInterface } from '@/components/pos/pos-interface';
import type { SalesOrder, CreateOrderInput, CreateOrderItemInput, SubmitOrderInput, ProcessPaymentInput, SubmitOrderResult, PaymentResult } from '@/lib/sales-types';

export default function PosPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';

  const [currentOrder, setCurrentOrder] = useState<SalesOrder | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitOrderResult | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCreateOrder();
  const addItem = useAddOrderItem();
  const removeItem = useRemoveOrderItem();
  const submitOrder = useSubmitOrder();
  const processPayment = useProcessPayment();

  const handleCreateOrder = useCallback(async (data: CreateOrderInput) => {
    setError(null);
    try {
      const order = await createOrder.mutateAsync({ restaurantId, data });
      setCurrentOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  }, [restaurantId, createOrder]);

  const handleAddItem = useCallback(async (itemData: CreateOrderItemInput) => {
    if (!currentOrder) return;
    setError(null);
    try {
      await addItem.mutateAsync({
        restaurantId,
        orderId: currentOrder.id,
        data: itemData,
      });
    } catch {
      // retry once
      try {
        await addItem.mutateAsync({
          restaurantId,
          orderId: currentOrder.id,
          data: itemData,
        });
      } catch {
        setError('Failed to add item');
      }
    }
  }, [restaurantId, currentOrder, addItem]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    if (!currentOrder) return;
    try {
      const updated = await removeItem.mutateAsync({
        restaurantId,
        orderId: currentOrder.id,
        itemId,
      });
      setCurrentOrder(updated);
    } catch {
      // handled
    }
  }, [restaurantId, currentOrder, removeItem]);

  const handleClearOrder = useCallback(() => {
    setCurrentOrder(null);
    setSubmitResult(null);
    setPaymentResult(null);
    setError(null);
  }, []);

  const handleSubmitOrder = useCallback(async (data: SubmitOrderInput) => {
    if (!currentOrder) return;
    setError(null);
    try {
      const result = await submitOrder.mutateAsync({
        restaurantId,
        orderId: currentOrder.id,
        data,
      });
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    }
  }, [restaurantId, currentOrder, submitOrder]);

  const handleProcessPayment = useCallback(async (data: ProcessPaymentInput) => {
    if (!currentOrder) return;
    setError(null);
    try {
      const result = await processPayment.mutateAsync({
        restaurantId,
        orderId: currentOrder.id,
        data,
      });
      setPaymentResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }, [restaurantId, currentOrder, processPayment]);

  const handleReset = useCallback(() => {
    setCurrentOrder(null);
    setSubmitResult(null);
    setPaymentResult(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Point of Sale</h1>
        <p className="text-sm text-muted-foreground">
          Create orders and process payments
        </p>
      </div>

      <PosInterface
        currentOrder={currentOrder}
        orderItems={currentOrder?.items ?? []}
        isCreating={createOrder.isPending}
        isSubmitting={submitOrder.isPending}
        isProcessingPayment={processPayment.isPending}
        submitResult={submitResult}
        paymentResult={paymentResult}
        error={error}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onClearOrder={handleClearOrder}
        onCreateOrder={handleCreateOrder}
        onSubmitOrder={handleSubmitOrder}
        onProcessPayment={handleProcessPayment}
        onReset={handleReset}
      />
    </div>
  );
}
