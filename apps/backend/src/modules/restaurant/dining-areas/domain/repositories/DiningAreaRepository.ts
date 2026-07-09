import type { DiningArea } from "../models/DiningArea.js";

export interface DiningAreaRepository {
  save(area: DiningArea): Promise<DiningArea>;
  update(area: DiningArea): Promise<DiningArea>;
  findById(id: string): Promise<DiningArea | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<DiningArea | null>;
  findByRestaurantId(restaurantId: string): Promise<DiningArea[]>;
  findByNameAndRestaurant(name: string, restaurantId: string): Promise<DiningArea | null>;
  findByCodeAndRestaurant(code: string, restaurantId: string): Promise<DiningArea | null>;
  findMaxDisplayOrder(restaurantId: string): Promise<number>;
}
