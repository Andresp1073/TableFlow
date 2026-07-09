import type { Restaurant } from "../models/Restaurant.js";

export interface RestaurantRepository {
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  save(restaurant: Restaurant): Promise<Restaurant>;
  update(restaurant: Restaurant): Promise<Restaurant>;
  softDelete(id: string): Promise<void>;
}
