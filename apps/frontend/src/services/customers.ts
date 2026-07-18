import { get, post, put, patch } from './api';
import type { Customer, CustomerDetail, CustomerDashboardData, CreateCustomerInput } from '@/lib/customer-types';

const BASE = '/restaurants';

export async function getCustomerDashboard(restaurantId: string): Promise<CustomerDashboardData> {
  const response = await get<CustomerDashboardData>(`${BASE}/${restaurantId}/customers/dashboard`);
  return response.data;
}

export async function listCustomers(restaurantId: string, params: { search?: string; status?: string } = {}): Promise<Customer[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  const response = await get<Customer[]>(`${BASE}/${restaurantId}/customers${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getCustomer(restaurantId: string, customerId: string): Promise<CustomerDetail> {
  const response = await get<CustomerDetail>(`${BASE}/${restaurantId}/customers/${customerId}`);
  return response.data;
}

export async function createCustomer(restaurantId: string, data: CreateCustomerInput): Promise<Customer> {
  const response = await post<Customer>(`${BASE}/${restaurantId}/customers`, data);
  return response.data;
}

export async function updateCustomer(restaurantId: string, customerId: string, data: Partial<CreateCustomerInput>): Promise<Customer> {
  const response = await put<Customer>(`${BASE}/${restaurantId}/customers/${customerId}`, data);
  return response.data;
}

export async function archiveCustomer(restaurantId: string, customerId: string): Promise<void> {
  await patch(`${BASE}/${restaurantId}/customers/${customerId}/archive`);
}

export async function restoreCustomer(restaurantId: string, customerId: string): Promise<void> {
  await patch(`${BASE}/${restaurantId}/customers/${customerId}/restore`);
}

export async function addCustomerNote(restaurantId: string, customerId: string, note: string): Promise<void> {
  await post(`${BASE}/${restaurantId}/customers/${customerId}/notes`, { note });
}
