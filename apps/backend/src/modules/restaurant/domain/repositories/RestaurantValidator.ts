import type { Restaurant } from "../models/Restaurant.js";

export interface RestaurantValidator {
  validateForCreation(data: Partial<Restaurant>): Promise<void>;
  validateForUpdate(data: Partial<Restaurant>): Promise<void>;
  ensureSlugIsUnique(slug: string, excludeId?: string): Promise<void>;
  ensureEmailIsUnique(email: string, excludeId?: string): Promise<void>;
}
