'use client';

import { useEffect } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useDashboard } from '@/hooks/use-dashboard';
import { DashboardGrid, DashboardGridItem } from '@/components/dashboard/dashboard-grid';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { TodayReservationsWidget } from '@/components/dashboard/widgets/today-reservations';
import { CurrentOccupancyWidget } from '@/components/dashboard/widgets/current-occupancy';
import { AvailableTablesWidget } from '@/components/dashboard/widgets/available-tables';
import { KitchenStatusWidget } from '@/components/dashboard/widgets/kitchen-status';
import { PendingOrdersWidget } from '@/components/dashboard/widgets/pending-orders';
import { LowInventoryAlertsWidget } from '@/components/dashboard/widgets/low-inventory-alerts';
import { RevenueSummaryWidget } from '@/components/dashboard/widgets/revenue-summary';
import { RecentActivityWidget } from '@/components/dashboard/widgets/recent-activity';
import { UpcomingReservationsWidget } from '@/components/dashboard/widgets/upcoming-reservations';
import { QuickStatisticsWidget } from '@/components/dashboard/widgets/quick-statistics';
import { PageWrapper } from '@/components/layout/page-wrapper';

export default function DashboardPage() {
  const { current, setCurrent, restaurants, setRestaurants } = useRestaurant();
  const { data: restaurantsData } = useRestaurants();

  useEffect(() => {
    if (restaurantsData?.data && restaurantsData.data.length > 0) {
      setRestaurants(restaurantsData.data);
      if (!current) {
        setCurrent(restaurantsData.data[0]);
      }
    }
  }, [restaurantsData, current, setCurrent, setRestaurants]);

  const restaurantId = current?.id ?? '';
  const { data, isLoading, isError, error, refetch } = useDashboard(restaurantId);

  return (
    <PageWrapper
      title="Dashboard"
      description="Overview of your restaurant operations"
    >
      <div className="space-y-4">
        <DashboardGrid>
          <DashboardGridItem colSpan={1}>
            <TodayReservationsWidget
              data={data?.todayReservations}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <CurrentOccupancyWidget
              data={data?.currentOccupancy}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <AvailableTablesWidget
              data={data?.availableTables}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <RevenueSummaryWidget
              data={data?.revenueSummary}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={2}>
            <UpcomingReservationsWidget
              data={data?.upcomingReservations}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={2}>
            <RecentActivityWidget
              data={data?.recentActivity}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <KitchenStatusWidget
              data={data?.kitchenStatus}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <PendingOrdersWidget
              data={data?.pendingOrders}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <LowInventoryAlertsWidget
              data={data?.lowInventoryAlerts}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
          <DashboardGridItem colSpan={1}>
            <QuickStatisticsWidget
              data={data?.quickStatistics}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefresh={() => refetch()}
              onRetry={() => refetch()}
            />
          </DashboardGridItem>
        </DashboardGrid>

        <DashboardGrid>
          <DashboardGridItem colSpan={2}>
            <QuickActions />
          </DashboardGridItem>
        </DashboardGrid>
      </div>
    </PageWrapper>
  );
}
