import type { Restaurant } from "../models/Restaurant.js";

export interface RestaurantDomainService {
  submitForReview(restaurant: Restaurant): Promise<Restaurant>;
  approve(restaurant: Restaurant): Promise<Restaurant>;
  reject(restaurant: Restaurant): Promise<Restaurant>;
  activate(restaurant: Restaurant): Promise<Restaurant>;
  deactivate(restaurant: Restaurant): Promise<Restaurant>;
  suspend(restaurant: Restaurant, reason?: string): Promise<Restaurant>;
  unsuspend(restaurant: Restaurant): Promise<Restaurant>;
  archive(restaurant: Restaurant): Promise<Restaurant>;
  transferOwnership(restaurant: Restaurant, newOwnerId: string): Promise<void>;
}
