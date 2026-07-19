'use client';

import { useParams, useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { useRestaurant } from '@/providers/restaurant-provider';
import { usePurchaseOrder, useSubmitPurchaseOrder, useApprovePurchaseOrder, useCancelPurchaseOrder } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { PurchaseOrderDetailView } from '@/components/inventory/purchase-orders/purchase-order-detail';
import { toast } from 'sonner';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const orderId = params['orderId'] as string;

  const { data, isLoading, isError } = usePurchaseOrder(restaurantId, orderId);
  const submitPO = useSubmitPurchaseOrder();
  const approvePO = useApprovePurchaseOrder();
  const cancelPO = useCancelPurchaseOrder();

  const handleSubmit = () => {
    submitPO.mutate({ restaurantId, orderId }, {
      onSuccess: () => { toast.success(t('Order submitted')); router.refresh(); },
      onError: () => toast.error(t('Failed to submit order')),
    });
  };

  const handleApprove = () => {
    approvePO.mutate({ restaurantId, orderId }, {
      onSuccess: () => { toast.success(t('Order approved')); router.refresh(); },
      onError: () => toast.error(t('Failed to approve order')),
    });
  };

  const handleReceive = () => {
    router.push(`/inventory/receiving?orderId=${orderId}`);
  };

  const handleCancel = () => {
    cancelPO.mutate({ restaurantId, orderId, reason: 'Cancelled by user' }, {
      onSuccess: () => { toast.success(t('Order cancelled')); router.refresh(); },
      onError: () => toast.error(t('Failed to cancel order')),
    });
  };

  return (
    <ContentArea>
      <PurchaseOrderDetailView
        data={data}
        isLoading={isLoading}
        isError={isError}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onReceive={handleReceive}
        onCancel={handleCancel}
      />
    </ContentArea>
  );
}
