export interface AvailabilityContext {
  restaurantId: string;
  date: string;
  time?: string;
  partySize?: number;
  duration?: number;
  diningAreaId?: string;
  tableTypeId?: string;
}
