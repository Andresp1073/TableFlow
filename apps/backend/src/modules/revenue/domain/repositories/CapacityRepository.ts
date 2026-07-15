import type { RestaurantCapacity } from "../models/RestaurantCapacity.js";

export interface CapacityRepository {
  findById(id: string): Promise<RestaurantCapacity | null>;
  findByRestaurant(restaurantId: string): Promise<RestaurantCapacity | null>;
  save(capacity: RestaurantCapacity): Promise<void>;
  delete(id: string): Promise<void>;
}
