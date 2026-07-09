import type { Restaurant } from "../models/Restaurant.js";
import type { RestaurantStatusValue } from "../models/RestaurantStatus.js";

export interface RestaurantQueryRepository {
  findAllActive(): Promise<Restaurant[]>;
  findByStatus(status: RestaurantStatusValue): Promise<Restaurant[]>;
  searchByName(query: string): Promise<Restaurant[]>;
  countByStatus(): Promise<Record<RestaurantStatusValue, number>>;
}
