'use client';

import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCreateSupplier } from '@/hooks/use-inventory';
import { ContentArea } from '@/components/layout/content-area';
import { SupplierForm } from '@/components/inventory/suppliers/supplier-form';
import { toast } from 'sonner';
import type { CreateSupplierInput } from '@/lib/inventory-types';

export default function NewSupplierPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const createSupplier = useCreateSupplier();

  const handleSubmit = (data: CreateSupplierInput) => {
    createSupplier.mutate({ restaurantId, data }, {
      onSuccess: () => {
        toast.success('Supplier created');
        router.push('/inventory/suppliers');
      },
      onError: () => toast.error('Failed to create supplier'),
    });
  };

  return (
    <ContentArea>
      <SupplierForm onSubmit={handleSubmit} onCancel={() => router.back()} isSubmitting={createSupplier.isPending} />
    </ContentArea>
  );
}
