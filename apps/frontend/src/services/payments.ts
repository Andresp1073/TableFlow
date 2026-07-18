import { get, post } from './api';
import type {
  PaymentTransaction,
  PaymentDashboard,
  PaymentProvider,
  PaymentListParams,
  PaymentListResponse,
  RefundInput,
  RefundResult,
} from '@/lib/payment-types';

export async function getPaymentDashboard(restaurantId: string): Promise<PaymentDashboard> {
  const response = await get<PaymentDashboard>(`/restaurants/${restaurantId}/payments/dashboard`);
  return response.data;
}

export async function listPayments(
  restaurantId: string,
  params: PaymentListParams = {},
): Promise<PaymentListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.providerId) query.set('providerId', params.providerId);
  if (params.methodType) query.set('methodType', params.methodType);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  const qs = query.toString();
  const response = await get<PaymentListResponse>(`/restaurants/${restaurantId}/payments${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getPayment(
  restaurantId: string,
  transactionId: string,
): Promise<PaymentTransaction> {
  const response = await get<{ transaction: PaymentTransaction }>(
    `/restaurants/${restaurantId}/payments/${transactionId}`,
  );
  return response.data.transaction;
}

export async function listPaymentProviders(restaurantId: string): Promise<PaymentProvider[]> {
  const response = await get<{ providers: PaymentProvider[] }>(
    `/restaurants/${restaurantId}/payments/providers`,
  );
  return response.data.providers;
}

export async function refundPayment(
  restaurantId: string,
  transactionId: string,
  data: RefundInput,
): Promise<RefundResult> {
  const response = await post<RefundResult>(
    `/restaurants/${restaurantId}/payments/${transactionId}/refund`,
    data,
  );
  return response.data;
}
