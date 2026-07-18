import { get, post, put, patch, del } from './api';
import type { SalesOrder, OrderDashboard, CreateOrderInput, CreateOrderItemInput, OrderItem } from '@/lib/sales-types';

const BASE = '/restaurants';

export async function getOrderDashboard(restaurantId: string): Promise<OrderDashboard> {
  const response = await get<OrderDashboard>(`${BASE}/${restaurantId}/orders/dashboard`);
  return response.data;
}

export async function listOrders(restaurantId: string, status?: string): Promise<SalesOrder[]> {
  const query = status ? `?status=${status}` : '';
  const response = await get<SalesOrder[]>(`${BASE}/${restaurantId}/orders${query}`);
  return response.data;
}

export async function getOrder(restaurantId: string, orderId: string): Promise<SalesOrder> {
  const response = await get<SalesOrder>(`${BASE}/${restaurantId}/orders/${orderId}`);
  return response.data;
}

export async function createOrder(restaurantId: string, data: CreateOrderInput): Promise<SalesOrder> {
  const response = await post<SalesOrder>(`${BASE}/${restaurantId}/orders`, data);
  return response.data;
}

export async function updateOrder(restaurantId: string, orderId: string, data: Partial<CreateOrderInput>): Promise<SalesOrder> {
  const response = await put<SalesOrder>(`${BASE}/${restaurantId}/orders/${orderId}`, data);
  return response.data;
}

export async function cancelOrder(restaurantId: string, orderId: string, reason?: string): Promise<SalesOrder> {
  const response = await patch<SalesOrder>(`${BASE}/${restaurantId}/orders/${orderId}/cancel`, { reason });
  return response.data;
}

export async function addOrderItem(restaurantId: string, orderId: string, data: CreateOrderItemInput): Promise<OrderItem> {
  const response = await post<OrderItem>(`${BASE}/${restaurantId}/orders/${orderId}/items`, data);
  return response.data;
}

export async function updateOrderItemQuantity(restaurantId: string, orderId: string, itemId: string, quantity: number): Promise<SalesOrder> {
  const response = await patch<SalesOrder>(`${BASE}/${restaurantId}/orders/${orderId}/items/${itemId}`, { quantity });
  return response.data;
}

export async function removeOrderItem(restaurantId: string, orderId: string, itemId: string): Promise<SalesOrder> {
  const response = await del<SalesOrder>(`${BASE}/${restaurantId}/orders/${orderId}/items/${itemId}`);
  return response.data;
}
