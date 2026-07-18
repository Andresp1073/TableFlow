'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customerService from '@/services/customers';
import type { CreateCustomerInput } from '@/lib/customer-types';

const CUSTOMER_KEY = 'customers';

export function useCustomerDashboard(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [CUSTOMER_KEY, 'dashboard', restaurantId],
    queryFn: () => customerService.getCustomerDashboard(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCustomers(restaurantId: string | undefined, params = {}) {
  return useQuery({
    queryKey: [CUSTOMER_KEY, 'list', restaurantId, params],
    queryFn: () => customerService.listCustomers(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCustomer(restaurantId: string | undefined, customerId: string | undefined) {
  return useQuery({
    queryKey: [CUSTOMER_KEY, 'detail', restaurantId, customerId],
    queryFn: () => customerService.getCustomer(restaurantId!, customerId!),
    enabled: !!restaurantId && !!customerId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: CreateCustomerInput }) =>
      customerService.createCustomer(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'list', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, customerId, data }: { restaurantId: string; customerId: string; data: Partial<CreateCustomerInput> }) =>
      customerService.updateCustomer(restaurantId, customerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'list', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'detail', variables.restaurantId, variables.customerId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useArchiveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, customerId }: { restaurantId: string; customerId: string }) =>
      customerService.archiveCustomer(restaurantId, customerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'list', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'detail', variables.restaurantId, variables.customerId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useRestoreCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, customerId }: { restaurantId: string; customerId: string }) =>
      customerService.restoreCustomer(restaurantId, customerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'list', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'detail', variables.restaurantId, variables.customerId] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}
