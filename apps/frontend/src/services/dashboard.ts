import { get } from './api';
import type { DashboardData, KitchenStatusData, LowInventoryAlertsData, RevenueSummaryData } from '@/lib/dashboard-types';

export async function getDashboard(restaurantId: string): Promise<DashboardData> {
  const response = await get<DashboardData>(`/restaurants/${restaurantId}/dashboard`);
  return response.data;
}

export async function getKitchenStatus(restaurantId: string): Promise<KitchenStatusData> {
  const response = await get<KitchenStatusData>(`/restaurants/${restaurantId}/dashboard/kitchen`);
  return response.data;
}

export async function getInventoryAlerts(restaurantId: string): Promise<LowInventoryAlertsData> {
  const response = await get<LowInventoryAlertsData>(`/restaurants/${restaurantId}/dashboard/inventory`);
  return response.data;
}

export async function getRevenueSummary(restaurantId: string): Promise<RevenueSummaryData> {
  const response = await get<RevenueSummaryData>(`/restaurants/${restaurantId}/dashboard/revenue`);
  return response.data;
}
