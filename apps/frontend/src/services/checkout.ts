import { get, post } from './api';
import type { SubmitOrderInput, ProcessPaymentInput, SubmitOrderResult, PaymentResult, OrderStatusResult } from '@/lib/sales-types';

const BASE = '/restaurants';

export async function submitOrder(restaurantId: string, orderId: string, data: SubmitOrderInput): Promise<SubmitOrderResult> {
  const response = await post<SubmitOrderResult>(`${BASE}/${restaurantId}/checkout/${orderId}/submit`, data);
  return response.data;
}

export async function processPayment(restaurantId: string, orderId: string, data: ProcessPaymentInput): Promise<PaymentResult> {
  const response = await post<PaymentResult>(`${BASE}/${restaurantId}/checkout/${orderId}/pay`, data);
  return response.data;
}

export async function getOrderStatus(restaurantId: string, orderId: string): Promise<OrderStatusResult> {
  const response = await get<OrderStatusResult>(`${BASE}/${restaurantId}/checkout/${orderId}/status`);
  return response.data;
}
