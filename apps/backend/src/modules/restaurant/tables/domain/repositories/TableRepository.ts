import type { Table } from "../models/Table.js";

export interface TableListFilters {
  restaurantId: string;
  diningAreaId?: string;
  tableTypeId?: string;
  status?: string;
  isReservable?: boolean;
  isActive?: boolean;
  minCapacity?: number;
}

export interface TableRepository {
  save(table: Table): Promise<Table>;
  update(table: Table): Promise<Table>;
  findById(id: string): Promise<Table | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<Table | null>;
  findByRestaurantId(restaurantId: string): Promise<Table[]>;
  findByFilters(filters: TableListFilters): Promise<Table[]>;
  findByNumberAndRestaurant(tableNumber: string, restaurantId: string): Promise<Table | null>;
  findByNameAndRestaurant(name: string, restaurantId: string): Promise<Table | null>;
  findByQrIdentifier(qrIdentifier: string, restaurantId: string): Promise<Table | null>;
  countByDiningArea(diningAreaId: string): Promise<number>;
  countByTableType(tableTypeId: string): Promise<number>;
}
