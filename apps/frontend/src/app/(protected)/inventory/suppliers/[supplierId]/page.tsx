'use client';

import { useParams } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useSupplier } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { SupplierDetailView } from '@/components/inventory/suppliers/supplier-detail';

export default function SupplierDetailPage() {
  const params = useParams();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const supplierId = params['supplierId'] as string;

  const { data, isLoading, isError } = useSupplier(restaurantId, supplierId);

  return (
    <ContentArea>
      <SupplierDetailView data={data} isLoading={isLoading} isError={isError} />
    </ContentArea>
  );
}
