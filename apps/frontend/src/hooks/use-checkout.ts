'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as checkoutService from '@/services/checkout';
import * as ordersService from '@/services/orders';
import type { SubmitOrderInput, ProcessPaymentInput } from '@/lib/sales-types';

const ORDERS_KEY = 'orders';
const ORDER_DASHBOARD_KEY = 'order-dashboard';

export function useSubmitOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      data,
    }: {
      restaurantId: string;
      orderId: string;
      data: SubmitOrderInput;
    }) => checkoutService.submitOrder(restaurantId, orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [ORDER_DASHBOARD_KEY, variables.restaurantId] });
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      data,
    }: {
      restaurantId: string;
      orderId: string;
      data: ProcessPaymentInput;
    }) => checkoutService.processPayment(restaurantId, orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [ORDER_DASHBOARD_KEY, variables.restaurantId] });
    },
  });
}

export function useOrderStatus(restaurantId: string | undefined, orderId: string | undefined) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'status', restaurantId, orderId],
    queryFn: () => checkoutService.getOrderStatus(restaurantId!, orderId!),
    enabled: !!restaurantId && !!orderId,
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 2,
  });
}
