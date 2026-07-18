'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as loyaltyService from '@/services/loyalty';

const LOYALTY_KEY = 'loyalty';

export function useLoyaltyDashboard(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'dashboard', restaurantId],
    queryFn: () => loyaltyService.getLoyaltyDashboard(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useRewards(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'rewards', restaurantId],
    queryFn: () => loyaltyService.getRewards(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCustomerLoyalty(restaurantId: string | undefined, customerProfileId: string | undefined) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'customer', restaurantId, customerProfileId],
    queryFn: () => loyaltyService.getCustomerLoyalty(restaurantId!, customerProfileId!),
    enabled: !!restaurantId && !!customerProfileId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useRegisterLoyaltyCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: Parameters<typeof loyaltyService.registerLoyaltyCustomer>[1] }) =>
      loyaltyService.registerLoyaltyCustomer(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useEarnPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: Parameters<typeof loyaltyService.earnPoints>[1] }) =>
      loyaltyService.earnPoints(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY, 'customer', variables.restaurantId] });
    },
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: Parameters<typeof loyaltyService.redeemReward>[1] }) =>
      loyaltyService.redeemReward(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY, 'customer', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useAdjustPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: Parameters<typeof loyaltyService.adjustPoints>[1] }) =>
      loyaltyService.adjustPoints(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY, 'customer', variables.restaurantId] });
    },
  });
}
