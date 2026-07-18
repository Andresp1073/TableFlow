'use client';

import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCreateCustomer } from '@/hooks/use-customers';
import { CustomerForm } from '@/components/customers/form/customer-form';
import { ContentArea } from '@/components/layout/content-area';
import { toast } from 'sonner';
import type { CreateCustomerInput } from '@/lib/customer-types';

export default function NewCustomerPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const createCustomer = useCreateCustomer();

  const handleSubmit = (data: CreateCustomerInput) => {
    createCustomer.mutate({ restaurantId, data }, {
      onSuccess: (result) => {
        toast.success('Customer created');
        router.push(`/customers/${result.id}`);
      },
      onError: () => toast.error('Failed to create customer'),
    });
  };

  return (
    <ContentArea>
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={createCustomer.isPending}
        mode="create"
      />
    </ContentArea>
  );
}
