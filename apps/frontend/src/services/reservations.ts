import { get, post, put, patch } from './api';
import type {
  ReservationDTO,
  ReservationSummary,
  ReservationCreateInput,
  ReservationUpdateInput,
  ReservationListParams,
} from '@/lib/reservation-types';

export async function listReservations(
  restaurantId: string,
  params: ReservationListParams = {},
): Promise<ReservationSummary[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.date) query.set('date', params.date);
  if (params.customerId) query.set('customerId', params.customerId);
  const qs = query.toString();
  const response = await get<ReservationSummary[]>(
    `/restaurants/${restaurantId}/reservations${qs ? `?${qs}` : ''}`,
  );
  return response.data;
}

export async function getReservation(
  restaurantId: string,
  reservationId: string,
): Promise<ReservationDTO> {
  const response = await get<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations/${reservationId}`,
  );
  return response.data;
}

export async function createReservation(
  restaurantId: string,
  data: ReservationCreateInput,
): Promise<ReservationDTO> {
  const response = await post<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations`,
    data,
  );
  return response.data;
}

export async function updateReservation(
  restaurantId: string,
  reservationId: string,
  data: ReservationUpdateInput,
): Promise<ReservationDTO> {
  const response = await put<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations/${reservationId}`,
    data,
  );
  return response.data;
}

export async function cancelReservation(
  restaurantId: string,
  reservationId: string,
): Promise<ReservationDTO> {
  const response = await patch<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations/${reservationId}/cancel`,
  );
  return response.data;
}

export async function confirmReservation(
  restaurantId: string,
  reservationId: string,
): Promise<ReservationDTO> {
  const response = await patch<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations/${reservationId}/confirm`,
  );
  return response.data;
}

export async function checkInReservation(
  restaurantId: string,
  reservationId: string,
): Promise<ReservationDTO> {
  const response = await patch<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations/${reservationId}/check-in`,
  );
  return response.data;
}

export async function completeReservation(
  restaurantId: string,
  reservationId: string,
): Promise<ReservationDTO> {
  const response = await patch<ReservationDTO>(
    `/restaurants/${restaurantId}/reservations/${reservationId}/complete`,
  );
  return response.data;
}
