export interface ListTablesQuery {
  restaurantId: string;
  diningAreaId?: string;
  tableTypeId?: string;
  status?: string;
  isReservable?: boolean;
  isActive?: boolean;
  minCapacity?: number;
}
