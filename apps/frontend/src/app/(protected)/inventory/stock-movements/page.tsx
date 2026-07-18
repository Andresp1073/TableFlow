'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useStockMovements } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { InventoryFilters } from '@/components/inventory/shared/inventory-filters';
import { MovementTable } from '@/components/inventory/stock-movements/movement-table';

export default function StockMovementsPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [movementType, setMovementType] = useState('');

  const { data, isLoading, error } = useStockMovements(restaurantId, { type: movementType || undefined });

  return (
    <PageWrapper>
      <PageHeader title={t("Stock Movements")} description={t("Track all stock entries, consumptions, adjustments, and transfers")} />
      <div className="space-y-4">
        <InventoryFilters movementType={movementType} onMovementTypeChange={setMovementType} showMovementType />
        <MovementTable data={data ?? []} loading={isLoading} error={error?.message ?? null} />
      </div>
    </PageWrapper>
  );
}
