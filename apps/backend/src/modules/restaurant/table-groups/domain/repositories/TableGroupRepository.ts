import type { TableGroup } from "../models/TableGroup.js";

export interface TableGroupListFilters {
  restaurantId: string;
  status?: string;
}

export interface TableGroupRepository {
  save(group: TableGroup): Promise<TableGroup>;
  update(group: TableGroup): Promise<TableGroup>;
  findById(id: string): Promise<TableGroup | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<TableGroup | null>;
  findByRestaurantId(restaurantId: string): Promise<TableGroup[]>;
  findByFilters(filters: TableGroupListFilters): Promise<TableGroup[]>;
  findActiveGroupTableIds(restaurantId: string): Promise<string[]>;
  findActiveGroupByTableId(tableId: string): Promise<TableGroup | null>;
}
