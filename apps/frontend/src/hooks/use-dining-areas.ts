'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as diningAreaService from '@/services/dining-areas';
import type { DiningAreaCreateInput, DiningAreaUpdateInput, DiningAreaListParams } from '@/lib/dining-area-types';

const DINING_AREAS_KEY = 'dining-areas';

export function useDiningAreas(restaurantId: string | undefined, params: DiningAreaListParams = {}) {
  return useQuery({
    queryKey: [DINING_AREAS_KEY, restaurantId, params],
    queryFn: () => diningAreaService.listDiningAreas(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useDiningArea(restaurantId: string | undefined, diningAreaId: string | undefined) {
  return useQuery({
    queryKey: [DINING_AREAS_KEY, restaurantId, diningAreaId],
    queryFn: () => diningAreaService.getDiningArea(restaurantId!, diningAreaId!),
    enabled: !!restaurantId && !!diningAreaId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateDiningArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: DiningAreaCreateInput }) =>
      diningAreaService.createDiningArea(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [DINING_AREAS_KEY, variables.restaurantId] });
    },
  });
}

export function useUpdateDiningArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, diningAreaId, data }: { restaurantId: string; diningAreaId: string; data: DiningAreaUpdateInput }) =>
      diningAreaService.updateDiningArea(restaurantId, diningAreaId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [DINING_AREAS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [DINING_AREAS_KEY, variables.restaurantId, variables.diningAreaId] });
    },
  });
}

export function useArchiveDiningArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, diningAreaId }: { restaurantId: string; diningAreaId: string }) =>
      diningAreaService.archiveDiningArea(restaurantId, diningAreaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [DINING_AREAS_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [DINING_AREAS_KEY, variables.restaurantId, variables.diningAreaId] });
    },
  });
}
