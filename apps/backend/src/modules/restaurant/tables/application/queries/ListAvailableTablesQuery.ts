export interface ListAvailableTablesQuery {
  restaurantId: string;
  date: string;
  time?: string;
  partySize?: number;
  duration?: number;
  diningAreaId?: string;
  tableTypeId?: string;
  minCapacity?: number;
  maxCapacity?: number;
  isAccessible?: boolean;
}
