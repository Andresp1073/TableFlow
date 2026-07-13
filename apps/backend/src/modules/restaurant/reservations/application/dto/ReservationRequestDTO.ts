export interface CreateReservationRequest {
  restaurantId: string;
  reservationNumber: string;
  customerId?: string | null;
  tableId?: string | null;
  tableGroupId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  source: string;
  notes?: string | null;
  specialRequests?: string | null;
}

export interface UpdateReservationRequest {
  customerId?: string | null;
  tableId?: string | null;
  tableGroupId?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  notes?: string | null;
  specialRequests?: string | null;
}
