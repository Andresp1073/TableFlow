'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getExecutiveDashboard,
  getSalesReport,
  getReservationReport,
  getOccupancyReport,
  getInventoryReport,
  getKitchenPerformance,
  getCustomerAnalytics,
  getFinancialReport,
  getAuditReport,
} from '@/services/analytics';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';
import { useRestaurant } from '@/providers/restaurant-provider';

function useRestaurantId() {
  const { current } = useRestaurant();
  return current?.id ?? 'default';
}

export function useExecutiveDashboard(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'executive', restaurantId, range],
    queryFn: () => getExecutiveDashboard(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useSalesReport(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'sales', restaurantId, range],
    queryFn: () => getSalesReport(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useReservationReport(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'reservations', restaurantId, range],
    queryFn: () => getReservationReport(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useOccupancyReport(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'occupancy', restaurantId, range],
    queryFn: () => getOccupancyReport(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useInventoryReport(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'inventory', restaurantId, range],
    queryFn: () => getInventoryReport(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useKitchenPerformance(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisWeek');

  return useQuery({
    queryKey: ['analytics', 'kitchen', restaurantId, range],
    queryFn: () => getKitchenPerformance(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useCustomerAnalytics(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'customers', restaurantId, range],
    queryFn: () => getCustomerAnalytics(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useFinancialReport(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'financial', restaurantId, range],
    queryFn: () => getFinancialReport(restaurantId, range),
    staleTime: 60_000,
  });
}

export function useAuditReport(dateRange?: DateRange) {
  const restaurantId = useRestaurantId();
  const range = dateRange ?? getDateRangeFromPreset('thisMonth');

  return useQuery({
    queryKey: ['analytics', 'audit', restaurantId, range],
    queryFn: () => getAuditReport(restaurantId, range),
    staleTime: 60_000,
  });
}
