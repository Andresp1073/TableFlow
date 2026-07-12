export interface CheckTableAvailabilityQuery {
  restaurantId: string;
  tableId: string;
  date: string;
  time?: string;
  partySize?: number;
  duration?: number;
}
