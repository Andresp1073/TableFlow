export interface ReservationDTO {
  id: string;
  restaurantId: string;
  reservationNumber: string;
  customerId: string | null;
  tableId: string | null;
  tableGroupId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: string;
  source: string;
  notes: string | null;
  specialRequests: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}
