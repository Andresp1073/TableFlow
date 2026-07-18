'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as settingsService from '@/services/settings';
import type { UpdateSettingsInput, UpdateBusinessHoursInput } from '@/lib/settings-types';

const SETTINGS_KEY = 'settings';
const BUSINESS_HOURS_KEY = 'business-hours';

export function useSettings(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [SETTINGS_KEY, restaurantId],
    queryFn: () => settingsService.getSettings(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useBusinessHours(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [BUSINESS_HOURS_KEY, restaurantId],
    queryFn: () => settingsService.getBusinessHours(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      data,
    }: {
      restaurantId: string;
      data: UpdateSettingsInput;
    }) => settingsService.updateSettings(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, variables.restaurantId] });
    },
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      data,
    }: {
      restaurantId: string;
      data: UpdateBusinessHoursInput;
    }) => settingsService.updateBusinessHours(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_HOURS_KEY, variables.restaurantId] });
    },
  });
}
