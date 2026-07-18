import { get, post, put, patch, del } from './api';
import type { Restaurant, RestaurantCreateInput, RestaurantUpdateInput, RestaurantListParams, RestaurantListMeta } from '@/lib/restaurant-types';

export async function listRestaurants(params: RestaurantListParams = {}): Promise<{ data: Restaurant[]; meta: RestaurantListMeta }> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  const qs = query.toString();
  const response = await get<Restaurant[]>(`/restaurants${qs ? `?${qs}` : ''}`);
  return {
    data: response.data,
    meta: response.meta! as unknown as RestaurantListMeta,
  };
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const response = await get<Restaurant>(`/restaurants/${id}`);
  return response.data;
}

export async function createRestaurant(data: RestaurantCreateInput): Promise<Restaurant> {
  const response = await post<Restaurant>('/restaurants', data);
  return response.data;
}

export async function updateRestaurant(id: string, data: RestaurantUpdateInput): Promise<Restaurant> {
  const response = await put<Restaurant>(`/restaurants/${id}`, data);
  return response.data;
}

export async function activateRestaurant(id: string): Promise<Restaurant> {
  const response = await patch<Restaurant>(`/restaurants/${id}/activate`);
  return response.data;
}

export async function suspendRestaurant(id: string, reason?: string): Promise<Restaurant> {
  const response = await patch<Restaurant>(`/restaurants/${id}/suspend`, reason ? { reason } : undefined);
  return response.data;
}

export async function archiveRestaurant(id: string): Promise<Restaurant> {
  const response = await del<Restaurant>(`/restaurants/${id}/archive`);
  return response.data;
}
