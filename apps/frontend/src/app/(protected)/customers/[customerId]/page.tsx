'use client';

import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useParams } from 'next/navigation';
import { useCustomer, useArchiveCustomer, useRestoreCustomer } from '@/hooks/use-customers';
import { CustomerProfileView } from '@/components/customers/profile/customer-profile-view';
import { ContentArea } from '@/components/layout/content-area';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const customerId = params.customerId as string;

  const { data, isLoading, isError, error } = useCustomer(restaurantId, customerId);
  const archiveCustomer = useArchiveCustomer();
  const restoreCustomer = useRestoreCustomer();

  const handleArchive = () => {
    archiveCustomer.mutate({ restaurantId, customerId }, {
      onSuccess: () => { toast.success('Customer archived'); router.push('/customers'); },
      onError: () => toast.error('Failed to archive customer'),
    });
  };

  const handleRestore = () => {
    restoreCustomer.mutate({ restaurantId, customerId }, {
      onSuccess: () => { toast.success('Customer restored'); router.refresh(); },
      onError: () => toast.error('Failed to restore customer'),
    });
  };

  return (
    <ContentArea>
      <CustomerProfileView
        data={data}
        isLoading={isLoading}
        isError={isError}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />
    </ContentArea>
  );
}
