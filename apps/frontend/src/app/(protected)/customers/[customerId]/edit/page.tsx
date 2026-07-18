'use client';

import { useRouter, useParams } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { CustomerForm } from '@/components/customers/form/customer-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentArea } from '@/components/layout/content-area';
import { toast } from 'sonner';
import type { CreateCustomerInput } from '@/lib/customer-types';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const customerId = params.customerId as string;

  const { data, isLoading, isError } = useCustomer(restaurantId, customerId);
  const updateCustomer = useUpdateCustomer();

  const handleSubmit = (formData: CreateCustomerInput) => {
    updateCustomer.mutate({ restaurantId, customerId, data: formData }, {
      onSuccess: () => {
        toast.success('Customer updated');
        router.push(`/customers/${customerId}`);
      },
      onError: () => toast.error('Failed to update customer'),
    });
  };

  if (isLoading) {
    return (
      <ContentArea>
        <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>
      </ContentArea>
    );
  }

  return (
    <ContentArea>
      <CustomerForm
        initialData={data ? {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email ?? '',
          phone: data.phone ?? '',
          birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
          notes: data.notes ?? '',
          marketingConsent: data.marketingConsent,
        } : undefined}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={updateCustomer.isPending}
        mode="edit"
      />
    </ContentArea>
  );
}
