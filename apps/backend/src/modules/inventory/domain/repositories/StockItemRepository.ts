import type { StockItem } from "../models/StockItem.js";

export interface StockItemRepository {
  findById(id: string): Promise<StockItem | null>;
  findByIngredient(ingredientId: string): Promise<StockItem[]>;
  findByRestaurant(restaurantId: string): Promise<StockItem[]>;
  findExpired(): Promise<StockItem[]>;
  findLowStock(threshold: number): Promise<StockItem[]>;
  save(item: StockItem): Promise<void>;
  delete(id: string): Promise<void>;
}
