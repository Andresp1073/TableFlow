'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useRewards } from '@/hooks/use-loyalty';
import { RewardHistoryView } from '@/components/loyalty/reward-history-view';
import { ContentArea } from '@/components/layout/content-area';

export default function RewardHistoryPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, isError } = useRewards(restaurantId);

  return (
    <ContentArea>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reward History</h1>
          <p className="text-sm text-muted-foreground">Available rewards and their details</p>
        </div>
        <RewardHistoryView data={data} isLoading={isLoading} isError={isError} />
      </div>
    </ContentArea>
  );
}
