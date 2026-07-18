'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCreateProduct } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { ProductForm } from '@/components/inventory/products/product-form';
import { toast } from 'sonner';
import type { CreateProductInput } from '@/lib/inventory-types';

export default function NewProductPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const createProduct = useCreateProduct();

  const handleSubmit = (data: CreateProductInput) => {
    createProduct.mutate({ restaurantId, data }, {
      onSuccess: () => {
        toast.success(t("Product created"));
        router.push('/inventory/products');
      },
      onError: () => toast.error(t("Failed to create product")),
    });
  };

  return (
    <ContentArea>
      <ProductForm onSubmit={handleSubmit} onCancel={() => router.back()} isSubmitting={createProduct.isPending} />
    </ContentArea>
  );
}
