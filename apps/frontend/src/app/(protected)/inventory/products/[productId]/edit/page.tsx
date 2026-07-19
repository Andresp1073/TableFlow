'use client';

import { useParams, useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useProduct, useUpdateProduct } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { ProductForm } from '@/components/inventory/products/product-form';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';
import type { CreateProductInput } from '@/lib/inventory-types';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const productId = params['productId'] as string;

  const { data, isLoading, isError, error, refetch } = useProduct(restaurantId, productId);
  const updateProduct = useUpdateProduct();

  if (isLoading) return <ContentArea><LoadingState message={t('Loading product...')} /></ContentArea>;
  if (isError) return <ContentArea><ErrorState message={error?.message} onRetry={() => refetch()} /></ContentArea>;
  if (!data) return null;

  const handleSubmit = (formData: CreateProductInput) => {
    updateProduct.mutate({ restaurantId, productId, data: formData }, {
      onSuccess: () => {
        toast.success(t('Product updated'));
        router.push(`/inventory/products/${productId}`);
      },
      onError: () => toast.error(t('Failed to update product')),
    });
  };

  return (
    <ContentArea>
      <ProductForm
        initialData={{
          name: data.name,
          category: data.category,
          unit: data.unit,
          costPerUnit: data.costPerUnit,
          sku: data.sku ?? undefined,
          perishable: data.perishable,
          shelfLifeDays: data.shelfLifeDays ?? undefined,
          storageInstructions: data.storageInstructions ?? undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={updateProduct.isPending}
      />
    </ContentArea>
  );
}
