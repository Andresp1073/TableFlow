import { get, put } from './api';
import type {
  RestaurantSettings,
  BusinessHours,
  UpdateSettingsInput,
  UpdateBusinessHoursInput,
} from '@/lib/settings-types';

export async function getSettings(restaurantId: string): Promise<RestaurantSettings> {
  const response = await get<RestaurantSettings>(`/restaurants/${restaurantId}/settings`);
  return response.data;
}

export async function updateSettings(
  restaurantId: string,
  data: UpdateSettingsInput,
): Promise<RestaurantSettings> {
  const response = await put<RestaurantSettings>(`/restaurants/${restaurantId}/settings`, data);
  return response.data;
}

export async function getBusinessHours(restaurantId: string): Promise<BusinessHours> {
  const response = await get<BusinessHours>(`/restaurants/${restaurantId}/business-hours`);
  return response.data;
}

export async function updateBusinessHours(
  restaurantId: string,
  data: UpdateBusinessHoursInput,
): Promise<BusinessHours> {
  const response = await put<BusinessHours>(`/restaurants/${restaurantId}/business-hours`, data);
  return response.data;
}
