'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reservationService from '@/services/reservations';
import type {
  ReservationCreateInput,
  ReservationUpdateInput,
  ReservationListParams,
} from '@/lib/reservation-types';

const RESERVATIONS_KEY = 'reservations';

export function useReservations(
  restaurantId: string | undefined,
  params: ReservationListParams = {},
) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, restaurantId, params],
    queryFn: () => reservationService.listReservations(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useReservation(
  restaurantId: string | undefined,
  reservationId: string | undefined,
) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, restaurantId, reservationId],
    queryFn: () => reservationService.getReservation(restaurantId!, reservationId!),
    enabled: !!restaurantId && !!reservationId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      data,
    }: {
      restaurantId: string;
      data: ReservationCreateInput;
    }) => reservationService.createReservation(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [RESERVATIONS_KEY, variables.restaurantId],
      });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      reservationId,
      data,
    }: {
      restaurantId: string;
      reservationId: string;
      data: ReservationUpdateInput;
    }) => reservationService.updateReservation(restaurantId, reservationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [RESERVATIONS_KEY, variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: [RESERVATIONS_KEY, variables.restaurantId, variables.reservationId],
      });
    },
  });
}

function useStatusMutation<TData = unknown>(
  config: {
    mutationFn: (args: {
      restaurantId: string;
      reservationId: string;
    }) => Promise<TData>;
  },
) {
  const queryClient = useQueryClient();
  return useMutation<TData, Error, { restaurantId: string; reservationId: string }>({
    mutationFn: (args) => config.mutationFn(args),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [RESERVATIONS_KEY, variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: [RESERVATIONS_KEY, variables.restaurantId, variables.reservationId],
      });
    },
  });
}

export function useCancelReservation() {
  return useStatusMutation({
    mutationFn: ({ restaurantId, reservationId }) =>
      reservationService.cancelReservation(restaurantId, reservationId),
  });
}

export function useConfirmReservation() {
  return useStatusMutation({
    mutationFn: ({ restaurantId, reservationId }) =>
      reservationService.confirmReservation(restaurantId, reservationId),
  });
}

export function useCheckInReservation() {
  return useStatusMutation({
    mutationFn: ({ restaurantId, reservationId }) =>
      reservationService.checkInReservation(restaurantId, reservationId),
  });
}

export function useCompleteReservation() {
  return useStatusMutation({
    mutationFn: ({ restaurantId, reservationId }) =>
      reservationService.completeReservation(restaurantId, reservationId),
  });
}
