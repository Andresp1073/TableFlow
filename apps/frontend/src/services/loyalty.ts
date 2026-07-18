import { get, post } from './api';
import type { LoyaltyDashboardData, Reward, CustomerLoyaltyData, PointsTransaction } from '@/lib/loyalty-types';

const BASE = '/restaurants';

export async function getLoyaltyDashboard(restaurantId: string): Promise<LoyaltyDashboardData> {
  const response = await get<LoyaltyDashboardData>(`${BASE}/${restaurantId}/loyalty/dashboard`);
  return response.data;
}

export async function getRewards(restaurantId: string): Promise<Reward[]> {
  const response = await get<Reward[]>(`${BASE}/${restaurantId}/loyalty/rewards`);
  return response.data;
}

export async function getCustomerLoyalty(restaurantId: string, customerProfileId: string): Promise<CustomerLoyaltyData> {
  const response = await get<CustomerLoyaltyData>(`${BASE}/${restaurantId}/loyalty/customers/${customerProfileId}`);
  return response.data;
}

export async function registerLoyaltyCustomer(restaurantId: string, data: {
  customerId: string; firstName: string; lastName: string; email: string; phone?: string; dateOfBirth?: string; programId: string;
}): Promise<{ profileId: string; accountId: string; currentBalance: number; tier: string }> {
  const response = await post<{ profileId: string; accountId: string; currentBalance: number; tier: string }>(`${BASE}/${restaurantId}/loyalty/register`, data);
  return response.data;
}

export async function earnPoints(restaurantId: string, data: {
  customerProfileId: string; spentAmount: number; referenceId: string; referenceType: string;
}): Promise<{ transactionId: string; points: number; balanceAfter: number }> {
  const response = await post<{ transactionId: string; points: number; balanceAfter: number }>(`${BASE}/${restaurantId}/loyalty/earn`, data);
  return response.data;
}

export async function redeemReward(restaurantId: string, data: {
  customerProfileId: string; rewardId: string; referenceId: string;
}): Promise<{ redemptionId: string; transactionId: string; pointsCost: number; balanceAfter: number; status: string }> {
  const response = await post<{ redemptionId: string; transactionId: string; pointsCost: number; balanceAfter: number; status: string }>(`${BASE}/${restaurantId}/loyalty/redeem`, data);
  return response.data;
}

export async function adjustPoints(restaurantId: string, data: {
  customerProfileId: string; points: number; reason: string;
}): Promise<{ transactionId: string; points: number; balanceAfter: number }> {
  const response = await post<{ transactionId: string; points: number; balanceAfter: number }>(`${BASE}/${restaurantId}/loyalty/adjust`, data);
  return response.data;
}

export async function getTransactionHistory(restaurantId: string, customerProfileId: string): Promise<PointsTransaction[]> {
  const response = await get<PointsTransaction[]>(`${BASE}/${restaurantId}/loyalty/transactions/${customerProfileId}`);
  return response.data;
}

export async function getBirthdays(restaurantId: string): Promise<Array<{ id: string; customerId: string; firstName: string; lastName: string; email: string; dateOfBirth?: string }>> {
  const response = await get<Array<{ id: string; customerId: string; firstName: string; lastName: string; email: string; dateOfBirth?: string }>>(`${BASE}/${restaurantId}/loyalty/birthdays`);
  return response.data;
}
