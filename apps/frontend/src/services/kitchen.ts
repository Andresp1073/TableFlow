import { get, post, patch } from './api';
import type {
  KitchenTicket,
  KitchenStationInfo,
  KitchenStats,
  CreateKitchenTicketInput,
  TicketStatus,
} from '@/lib/order-types';

const BASE = '/restaurants';

/* ───── Kitchen Stats ───── */

export async function getKitchenStats(restaurantId: string): Promise<KitchenStats> {
  const response = await get<KitchenStats>(
    `${BASE}/${restaurantId}/dashboard/kitchen`,
  );
  return response.data;
}

/* ───── Kitchen Tickets ───── */

export async function listTickets(
  restaurantId: string,
  stationId?: string,
): Promise<KitchenTicket[]> {
  const query = new URLSearchParams();
  if (stationId) query.set('stationId', stationId);
  const qs = query.toString();
  const response = await get<KitchenTicket[]>(
    `${BASE}/${restaurantId}/kitchen/tickets${qs ? `?${qs}` : ''}`,
  );
  return response.data;
}

export async function getTicket(
  restaurantId: string,
  ticketId: string,
): Promise<KitchenTicket> {
  const response = await get<KitchenTicket>(
    `${BASE}/${restaurantId}/kitchen/tickets/${ticketId}`,
  );
  return response.data;
}

export async function createTicket(
  restaurantId: string,
  data: CreateKitchenTicketInput,
): Promise<KitchenTicket> {
  const response = await post<KitchenTicket>(
    `${BASE}/${restaurantId}/kitchen/tickets`,
    data,
  );
  return response.data;
}

export async function updateTicketStatus(
  restaurantId: string,
  ticketId: string,
  status: TicketStatus,
  reason?: string,
): Promise<KitchenTicket> {
  const response = await patch<KitchenTicket>(
    `${BASE}/${restaurantId}/kitchen/tickets/${ticketId}/status`,
    { status, reason },
  );
  return response.data;
}

/* ───── Kitchen Stations ───── */

export async function listKitchenStations(
  restaurantId: string,
): Promise<KitchenStationInfo[]> {
  const response = await get<KitchenStationInfo[]>(
    `${BASE}/${restaurantId}/kitchen/stations`,
  );
  return response.data;
}

export async function getKitchenStation(
  restaurantId: string,
  stationId: string,
): Promise<KitchenStationInfo> {
  const response = await get<KitchenStationInfo>(
    `${BASE}/${restaurantId}/kitchen/stations/${stationId}`,
  );
  return response.data;
}
