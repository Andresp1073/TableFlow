'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as restaurantService from '@/services/restaurants';
import type { RestaurantListParams, RestaurantCreateInput, RestaurantUpdateInput } from '@/lib/restaurant-types';

const RESTAURANTS_KEY = 'restaurants';

export function useRestaurants(params: RestaurantListParams = {}) {
  return useQuery({
    queryKey: [RESTAURANTS_KEY, params],
    queryFn: () => restaurantService.listRestaurants(params),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: [RESTAURANTS_KEY, id],
    queryFn: () => restaurantService.getRestaurant(id!),
    enabled: !!id,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RestaurantCreateInput) => restaurantService.createRestaurant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY] });
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RestaurantUpdateInput }) =>
      restaurantService.updateRestaurant(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY, variables.id] });
    },
  });
}

export function useActivateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.activateRestaurant(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY, id] });
    },
  });
}

export function useSuspendRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      restaurantService.suspendRestaurant(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY, variables.id] });
    },
  });
}

export function useArchiveRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.archiveRestaurant(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESTAURANTS_KEY, id] });
    },
  });
}
