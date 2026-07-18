import { get, post, put, patch } from './api';
import type { DiningArea, DiningAreaCreateInput, DiningAreaUpdateInput, DiningAreaListParams } from '@/lib/dining-area-types';

export async function listDiningAreas(restaurantId: string, params: DiningAreaListParams = {}): Promise<DiningArea[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  const response = await get<DiningArea[]>(`/restaurants/${restaurantId}/dining-areas${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getDiningArea(restaurantId: string, diningAreaId: string): Promise<DiningArea> {
  const response = await get<DiningArea>(`/restaurants/${restaurantId}/dining-areas/${diningAreaId}`);
  return response.data;
}

export async function createDiningArea(restaurantId: string, data: DiningAreaCreateInput): Promise<DiningArea> {
  const response = await post<DiningArea>(`/restaurants/${restaurantId}/dining-areas`, data);
  return response.data;
}

export async function updateDiningArea(restaurantId: string, diningAreaId: string, data: DiningAreaUpdateInput): Promise<DiningArea> {
  const response = await put<DiningArea>(`/restaurants/${restaurantId}/dining-areas/${diningAreaId}`, data);
  return response.data;
}

export async function archiveDiningArea(restaurantId: string, diningAreaId: string): Promise<DiningArea> {
  const response = await patch<DiningArea>(`/restaurants/${restaurantId}/dining-areas/${diningAreaId}/archive`);
  return response.data;
}
