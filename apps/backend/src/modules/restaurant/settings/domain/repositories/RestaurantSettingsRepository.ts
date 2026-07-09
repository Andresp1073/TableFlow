import type { RestaurantSettings } from "../models/RestaurantSettings.js";

export interface RestaurantSettingsRepository {
  findByRestaurantId(restaurantId: string): Promise<RestaurantSettings | null>;
  save(settings: RestaurantSettings): Promise<RestaurantSettings>;
  update(settings: RestaurantSettings): Promise<RestaurantSettings>;
}
