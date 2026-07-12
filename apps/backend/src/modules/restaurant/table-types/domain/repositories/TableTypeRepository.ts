import type { TableType } from "../models/TableType.js";

export interface TableTypeRepository {
  save(type: TableType): Promise<TableType>;
  update(type: TableType): Promise<TableType>;
  findById(id: string): Promise<TableType | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<TableType | null>;
  findByRestaurantId(restaurantId: string): Promise<TableType[]>;
  findByNameAndRestaurant(name: string, restaurantId: string): Promise<TableType | null>;
  findByCodeAndRestaurant(code: string, restaurantId: string): Promise<TableType | null>;
  findMaxDisplayOrder(restaurantId: string): Promise<number>;
}
