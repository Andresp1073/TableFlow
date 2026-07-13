export interface UpdateReservationCommand {
  id: string;
  restaurantId: string;
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
