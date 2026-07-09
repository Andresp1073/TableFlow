import type { Restaurant } from "../models/Restaurant.js";
import type { RestaurantStatusValue } from "../models/RestaurantStatus.js";

export interface RestaurantValidationService {
  assertIsActive(restaurant: Restaurant): void;
  assertNotDeleted(restaurant: Restaurant): void;
  assertNotArchived(restaurant: Restaurant): void;
  assertCanTransitionTo(restaurant: Restaurant, targetStatus: RestaurantStatusValue): void;
}
