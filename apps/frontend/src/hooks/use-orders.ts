'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersService from '@/services/orders';
import type { CreateOrderInput, CreateOrderItemInput } from '@/lib/sales-types';

const ORDERS_KEY = 'orders';
const ORDER_DASHBOARD_KEY = 'order-dashboard';

export function useOrderDashboard(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [ORDER_DASHBOARD_KEY, restaurantId],
    queryFn: () => ordersService.getOrderDashboard(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useOrders(restaurantId: string | undefined, status?: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, restaurantId, status],
    queryFn: () => ordersService.listOrders(restaurantId!, status),
    enabled: !!restaurantId,
    staleTime: 15_000,
    retry: 2,
  });
}

export function useOrder(restaurantId: string | undefined, orderId: string | undefined) {
  return useQuery({
    queryKey: [ORDERS_KEY, restaurantId, orderId],
    queryFn: () => ordersService.getOrder(restaurantId!, orderId!),
    enabled: !!restaurantId && !!orderId,
    staleTime: 15_000,
    retry: 2,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      data,
    }: {
      restaurantId: string;
      data: CreateOrderInput;
    }) => ordersService.createOrder(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [ORDER_DASHBOARD_KEY, variables.restaurantId] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      data,
    }: {
      restaurantId: string;
      orderId: string;
      data: Partial<CreateOrderInput>;
    }) => ordersService.updateOrder(restaurantId, orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      reason,
    }: {
      restaurantId: string;
      orderId: string;
      reason?: string;
    }) => ordersService.cancelOrder(restaurantId, orderId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [ORDER_DASHBOARD_KEY, variables.restaurantId] });
    },
  });
}

export function useAddOrderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      data,
    }: {
      restaurantId: string;
      orderId: string;
      data: CreateOrderItemInput;
    }) => ordersService.addOrderItem(restaurantId, orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
    },
  });
}

export function useUpdateOrderItemQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      itemId,
      quantity,
    }: {
      restaurantId: string;
      orderId: string;
      itemId: string;
      quantity: number;
    }) => ordersService.updateOrderItemQuantity(restaurantId, orderId, itemId, quantity),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
    },
  });
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      orderId,
      itemId,
    }: {
      restaurantId: string;
      orderId: string;
      itemId: string;
    }) => ordersService.removeOrderItem(restaurantId, orderId, itemId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, variables.restaurantId] });
    },
  });
}
