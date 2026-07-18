'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useProducts, useSuppliers, useCreatePurchaseOrder } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { PurchaseOrderForm } from '@/components/inventory/purchase-orders/purchase-order-form';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';

  const { data: products, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useProducts(restaurantId);
  const { data: suppliers, isLoading: suppliersLoading, isError: suppliersError, refetch: refetchSuppliers } = useSuppliers(restaurantId);
  const createPO = useCreatePurchaseOrder();

  if (productsLoading || suppliersLoading) return <ContentArea><LoadingState message={t("Loading form data...")} /></ContentArea>;
  if (productsError) return <ContentArea><ErrorState message={t("Failed to load products")} onRetry={() => refetchProducts()} /></ContentArea>;
  if (suppliersError) return <ContentArea><ErrorState message={t("Failed to load suppliers")} onRetry={() => refetchSuppliers()} /></ContentArea>;

  const handleSubmit = (data: { supplierId: string; supplierName: string; items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; unitCost: number }[]; notes?: string; createdBy: string; expectedDeliveryAt?: string }) => {
    createPO.mutate({ restaurantId, data }, {
      onSuccess: () => {
        toast.success(t("Purchase order created"));
        router.push('/inventory/purchase-orders');
      },
      onError: () => toast.error(t("Failed to create purchase order")),
    });
  };

  return (
    <ContentArea>
      <PurchaseOrderForm
        products={products ?? []}
        suppliers={suppliers ?? []}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={createPO.isPending}
        createdBy={current?.id ?? 'system'}
      />
    </ContentArea>
  );
}
