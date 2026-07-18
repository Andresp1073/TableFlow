'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useProduct, useArchiveProduct, useRestoreProduct } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { ProductDetailView } from '@/components/inventory/products/product-detail';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const productId = params['productId'] as string;

  const { data, isLoading, isError } = useProduct(restaurantId, productId);
  const archiveProduct = useArchiveProduct();
  const restoreProduct = useRestoreProduct();

  const handleArchive = () => {
    archiveProduct.mutate({ restaurantId, productId }, {
      onSuccess: () => { toast.success('Product archived'); router.refresh(); },
      onError: () => toast.error('Failed to archive product'),
    });
  };

  const handleRestore = () => {
    restoreProduct.mutate({ restaurantId, productId }, {
      onSuccess: () => { toast.success('Product restored'); router.refresh(); },
      onError: () => toast.error('Failed to restore product'),
    });
  };

  return (
    <ContentArea>
      <ProductDetailView data={data} isLoading={isLoading} isError={isError} onArchive={handleArchive} onRestore={handleRestore} />
    </ContentArea>
  );
}
