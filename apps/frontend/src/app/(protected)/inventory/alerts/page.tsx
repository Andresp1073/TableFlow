'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useInventoryAlerts } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { AlertsView } from '@/components/inventory/alerts/alerts-view';

export default function AlertsPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, isError, refetch } = useInventoryAlerts(restaurantId);

  return (
    <PageWrapper>
      <PageHeader title="Inventory Alerts" description="Low stock, expiring items, and pending receipts" />
      <AlertsView data={data} isLoading={isLoading} isError={isError} onRefresh={() => refetch()} />
    </PageWrapper>
  );
}
