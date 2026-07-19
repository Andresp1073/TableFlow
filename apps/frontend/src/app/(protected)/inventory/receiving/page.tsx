'use client';
import { t } from '@/lib/i18n';

import { useSearchParams, useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useProducts, useReceiveStock } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { ReceivingForm } from '@/components/inventory/receiving/receiving-form';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';
import type { ReceiveStockItem } from '@/lib/inventory-types';

export default function ReceivingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const initialOrderId = searchParams.get('orderId') ?? undefined;

  const { data: products, isLoading, isError, refetch } = useProducts(restaurantId);
  const receiveStock = useReceiveStock();

  if (isLoading) return <ContentArea><LoadingState message={t("Loading products...")} /></ContentArea>;
  if (isError) return <ContentArea><ErrorState message={t("Failed to load products")} onRetry={() => refetch()} /></ContentArea>;

  const handleSubmit = (items: ReceiveStockItem[], notes?: string) => {
    receiveStock.mutate({ restaurantId, items, notes }, {
      onSuccess: (result) => {
        toast.success(t('Received {count} items', { count: result.received }));
        if (initialOrderId) {
          router.push(`/inventory/purchase-orders/${initialOrderId}`);
        } else {
          router.push('/inventory/stock');
        }
      },
      onError: () => toast.error(t("Failed to receive stock")),
    });
  };

  return (
    <ContentArea>
      <PageHeader title={initialOrderId ? t('Receive Purchase Order') : t('Receive Stock')} description={t('Record incoming stock items')} />
      <ReceivingForm
        products={products ?? []}
        initialOrderId={initialOrderId}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={receiveStock.isPending}
      />
    </ContentArea>
  );
}
