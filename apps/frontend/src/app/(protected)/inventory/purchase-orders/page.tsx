'use client';

import { useState } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { usePurchaseOrders, useSubmitPurchaseOrder, useApprovePurchaseOrder, useCancelPurchaseOrder } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { InventoryFilters } from '@/components/inventory/shared/inventory-filters';
import { PurchaseOrderList } from '@/components/inventory/purchase-orders/purchase-order-list';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = usePurchaseOrders(restaurantId, { status: status || undefined });
  const submitPO = useSubmitPurchaseOrder();
  const approvePO = useApprovePurchaseOrder();
  const cancelPO = useCancelPurchaseOrder();

  const handleSubmit = (orderId: string) => {
    submitPO.mutate({ restaurantId, orderId }, {
      onSuccess: () => toast.success('Purchase order submitted'),
      onError: () => toast.error('Failed to submit order'),
    });
  };

  const handleApprove = (orderId: string) => {
    approvePO.mutate({ restaurantId, orderId }, {
      onSuccess: () => toast.success('Purchase order approved'),
      onError: () => toast.error('Failed to approve order'),
    });
  };

  const handleCancel = (orderId: string) => {
    cancelPO.mutate({ restaurantId, orderId, reason: 'Cancelled by user' }, {
      onSuccess: () => toast.success('Purchase order cancelled'),
      onError: () => toast.error('Failed to cancel order'),
    });
  };

  return (
    <PageWrapper>
      <PageHeader title="Purchase Orders" description="Manage orders to suppliers" createHref="/inventory/purchase-orders/new" createLabel="New Order" />
      <div className="space-y-4">
        <InventoryFilters status={status} onStatusChange={setStatus} showStatus />
        <PurchaseOrderList
          data={data ?? []}
          loading={isLoading}
          error={error?.message ?? null}
          onSubmit={handleSubmit}
          onApprove={handleApprove}
          onCancel={handleCancel}
        />
      </div>
    </PageWrapper>
  );
}
