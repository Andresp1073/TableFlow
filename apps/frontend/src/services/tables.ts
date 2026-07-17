import { get, post, put, patch } from './api';
import type {
  RestaurantTable,
  TableCreateInput,
  TableUpdateInput,
  TableListParams,
  StatusChangeInput,
  StatusChangeResult,
  StatusTransition,
} from '@/lib/table-types';

export async function listTables(restaurantId: string, params: TableListParams = {}): Promise<RestaurantTable[]> {
  const query = new URLSearchParams();
  if (params.diningAreaId) query.set('diningAreaId', params.diningAreaId);
  if (params.tableTypeId) query.set('tableTypeId', params.tableTypeId);
  if (params.status) query.set('status', params.status);
  if (params.minCapacity !== undefined) query.set('minCapacity', String(params.minCapacity));
  const qs = query.toString();
  const response = await get<RestaurantTable[]>(`/restaurants/${restaurantId}/tables${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getTable(restaurantId: string, tableId: string): Promise<RestaurantTable> {
  const response = await get<RestaurantTable>(`/restaurants/${restaurantId}/tables/${tableId}`);
  return response.data;
}

export async function createTable(restaurantId: string, data: TableCreateInput): Promise<RestaurantTable> {
  const response = await post<RestaurantTable>(`/restaurants/${restaurantId}/tables`, data);
  return response.data;
}

export async function updateTable(restaurantId: string, tableId: string, data: TableUpdateInput): Promise<RestaurantTable> {
  const response = await put<RestaurantTable>(`/restaurants/${restaurantId}/tables/${tableId}`, data);
  return response.data;
}

export async function archiveTable(restaurantId: string, tableId: string): Promise<RestaurantTable> {
  const response = await patch<RestaurantTable>(`/restaurants/${restaurantId}/tables/${tableId}/archive`);
  return response.data;
}

export async function changeTableStatus(
  restaurantId: string,
  tableId: string,
  data: StatusChangeInput,
): Promise<StatusChangeResult> {
  const response = await patch<StatusChangeResult>(`/restaurants/${restaurantId}/tables/${tableId}/status`, data);
  return response.data;
}

export async function getTableTransitions(restaurantId: string, tableId: string): Promise<StatusTransition> {
  const response = await get<StatusTransition>(`/restaurants/${restaurantId}/tables/${tableId}/transitions`);
  return response.data;
}
