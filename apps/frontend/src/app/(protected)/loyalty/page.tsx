'use client';
import { t } from '@/lib/i18n';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useLoyaltyDashboard } from '@/hooks/use-loyalty';
import { LoyaltyDashboardContent } from '@/components/loyalty/loyalty-dashboard-content';
import { ContentArea } from '@/components/layout/content-area';

export default function LoyaltyPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, isError, error, refetch } = useLoyaltyDashboard(restaurantId);

  return (
    <ContentArea>
      <LoyaltyDashboardContent
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onRefresh={() => refetch()}
      />
    </ContentArea>
  );
}
