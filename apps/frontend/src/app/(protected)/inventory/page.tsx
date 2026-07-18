'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useInventoryDashboard } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { InventoryDashboardContent } from '@/components/inventory/dashboard/inventory-dashboard-content';

export default function InventoryDashboardPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, isError, error, refetch } = useInventoryDashboard(restaurantId);

  return (
    <PageWrapper title="Inventory" description="Manage inventory stock, suppliers, and orders.">
      <InventoryDashboardContent
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRefresh={() => refetch()}
        onRetry={() => refetch()}
      />
    </PageWrapper>
  );
}
