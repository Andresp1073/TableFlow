export interface ReservationSummary {
  id: string;
  restaurantId: string;
  reservationNumber: string;
  customerId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: string;
  source: string;
  createdAt: string;
}
