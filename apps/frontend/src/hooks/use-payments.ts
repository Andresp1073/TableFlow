'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentService from '@/services/payments';
import type { PaymentListParams, RefundInput } from '@/lib/payment-types';

const PAYMENTS_KEY = 'payments';
const PAYMENT_KEY = 'payment';
const DASHBOARD_KEY = 'payment-dashboard';
const PROVIDERS_KEY = 'payment-providers';

export function usePaymentDashboard(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, restaurantId],
    queryFn: () => paymentService.getPaymentDashboard(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 15_000,
    retry: 2,
  });
}

export function usePayments(restaurantId: string | undefined, params: PaymentListParams = {}) {
  return useQuery({
    queryKey: [PAYMENTS_KEY, restaurantId, params],
    queryFn: () => paymentService.listPayments(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 15_000,
    retry: 2,
  });
}

export function usePayment(restaurantId: string | undefined, transactionId: string | undefined) {
  return useQuery({
    queryKey: [PAYMENT_KEY, restaurantId, transactionId],
    queryFn: () => paymentService.getPayment(restaurantId!, transactionId!),
    enabled: !!restaurantId && !!transactionId,
    staleTime: 15_000,
    retry: 2,
  });
}

export function usePaymentProviders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [PROVIDERS_KEY, restaurantId],
    queryFn: () => paymentService.listPaymentProviders(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      transactionId,
      data,
    }: {
      restaurantId: string;
      transactionId: string;
      data: RefundInput;
    }) => paymentService.refundPayment(restaurantId, transactionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [PAYMENT_KEY, variables.restaurantId, variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY, variables.restaurantId] });
    },
  });
}
