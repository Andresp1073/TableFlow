'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as kitchenService from '@/services/kitchen';
import { KDS_REFRESH_INTERVAL_MS } from '@/lib/order-types';
import type { TicketStatus } from '@/lib/order-types';

const STATS_KEY = 'kitchen-stats';
const TICKETS_KEY = 'kitchen-tickets';
const STATIONS_KEY = 'kitchen-stations';

export function useKitchenStats(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [STATS_KEY, restaurantId],
    queryFn: () => kitchenService.getKitchenStats(restaurantId!),
    enabled: !!restaurantId,
    refetchInterval: KDS_REFRESH_INTERVAL_MS,
    staleTime: KDS_REFRESH_INTERVAL_MS / 2,
    retry: 2,
  });
}

export function useKitchenTickets(
  restaurantId: string | undefined,
  stationId?: string,
) {
  return useQuery({
    queryKey: [TICKETS_KEY, restaurantId, stationId],
    queryFn: () => kitchenService.listTickets(restaurantId!, stationId),
    enabled: !!restaurantId,
    refetchInterval: KDS_REFRESH_INTERVAL_MS,
    staleTime: KDS_REFRESH_INTERVAL_MS / 2,
    retry: 2,
  });
}

export function useKitchenTicket(
  restaurantId: string | undefined,
  ticketId: string | undefined,
) {
  return useQuery({
    queryKey: [TICKETS_KEY, restaurantId, ticketId],
    queryFn: () => kitchenService.getTicket(restaurantId!, ticketId!),
    enabled: !!restaurantId && !!ticketId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useKitchenStations(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [STATIONS_KEY, restaurantId],
    queryFn: () => kitchenService.listKitchenStations(restaurantId!),
    enabled: !!restaurantId,
    refetchInterval: KDS_REFRESH_INTERVAL_MS * 3,
    staleTime: KDS_REFRESH_INTERVAL_MS,
    retry: 2,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      data,
    }: {
      restaurantId: string;
      data: Parameters<typeof kitchenService.createTicket>[1];
    }) => kitchenService.createTicket(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [TICKETS_KEY, variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: [STATS_KEY, variables.restaurantId],
      });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      ticketId,
      status,
      reason,
    }: {
      restaurantId: string;
      ticketId: string;
      status: TicketStatus;
      reason?: string;
    }) => kitchenService.updateTicketStatus(restaurantId, ticketId, status, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [TICKETS_KEY, variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: [STATS_KEY, variables.restaurantId],
      });
    },
  });
}
