'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useStockSummary } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { StockTable } from '@/components/inventory/stock/stock-table';

export default function StockPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, error } = useStockSummary(restaurantId);

  return (
    <PageWrapper>
      <PageHeader title="Stock" description="Current inventory stock levels across all products" />
      <StockTable data={data ?? []} loading={isLoading} error={error?.message ?? null} />
    </PageWrapper>
  );
}
