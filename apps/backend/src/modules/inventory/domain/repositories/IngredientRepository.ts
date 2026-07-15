import type { Ingredient } from "../models/Ingredient.js";
import type { IngredientCategory } from "../models/Ingredient.js";

export interface IngredientRepository {
  findById(id: string): Promise<Ingredient | null>;
  findByRestaurant(restaurantId: string): Promise<Ingredient[]>;
  findByCategory(category: IngredientCategory): Promise<Ingredient[]>;
  findActive(restaurantId: string): Promise<Ingredient[]>;
  save(ingredient: Ingredient): Promise<void>;
  delete(id: string): Promise<void>;
}
