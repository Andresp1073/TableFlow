'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/services/dashboard';
import type { DashboardData, WidgetType } from '@/lib/dashboard-types';

const DASHBOARD_QUERY_KEY = 'dashboard';
const REFRESH_INTERVAL_MS = 60_000;

export function useDashboard(restaurantId: string) {
  return useQuery<DashboardData>({
    queryKey: [DASHBOARD_QUERY_KEY, restaurantId],
    queryFn: () => getDashboard(restaurantId),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useDashboardWidget(restaurantId: string, widget: WidgetType) {
  const query = useDashboard(restaurantId);
  return {
    data: query.data?.[widget],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
