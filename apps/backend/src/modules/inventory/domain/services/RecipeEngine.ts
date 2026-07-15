import type { Recipe, RecipeIngredient } from "../models/Recipe.js";
import type { Ingredient } from "../models/Ingredient.js";

export interface ConsumptionResult {
  recipeId: string;
  recipeName: string;
  servings: number;
  consumed: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  totalCost: number;
  costPerServing: number;
}

export interface StockCheckResult {
  ingredientId: string;
  ingredientName: string;
  required: number;
  available: number;
  sufficient: boolean;
  shortfall: number;
}

export class RecipeEngine {
  calculateConsumption(
    recipe: Recipe,
    servings: number,
    ingredientCosts: Map<string, { name: string; costPerUnit: number }>,
  ): ConsumptionResult {
    const ingredients = recipe.scaleIngredients(servings);
    const consumed: ConsumptionResult["consumed"] = [];
    let totalCost = 0;

    for (const ing of ingredients) {
      const costInfo = ingredientCosts.get(ing.ingredientId);
      const cost = costInfo ? (ing.quantity * costInfo.costPerUnit) : 0;
      totalCost += cost;
      consumed.push({
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName,
        quantity: ing.quantity,
        unit: ing.unit,
        cost,
      });
    }

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      servings,
      consumed,
      totalCost,
      costPerServing: servings > 0 ? totalCost / servings : 0,
    };
  }

  checkStockAvailability(
    recipe: Recipe,
    servings: number,
    availableStock: Map<string, number>,
  ): StockCheckResult[] {
    const required = recipe.scaleIngredients(servings);
    const results: StockCheckResult[] = [];

    for (const ing of required) {
      const available = availableStock.get(ing.ingredientId) ?? 0;
      const sufficient = available >= ing.quantity;
      results.push({
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName,
        required: ing.quantity,
        available,
        sufficient,
        shortfall: Math.max(0, ing.quantity - available),
      });
    }

    return results;
  }

  canFulfill(
    recipe: Recipe,
    servings: number,
    availableStock: Map<string, number>,
  ): boolean {
    const checks = this.checkStockAvailability(recipe, servings, availableStock);
    return checks.every((c) => c.sufficient);
  }

  calculateRequiredPurchases(
    recipe: Recipe,
    servings: number,
    availableStock: Map<string, number>,
    policies: Map<string, number>,
  ): Array<{ ingredientId: string; ingredientName: string; quantity: number }> {
    const checks = this.checkStockAvailability(recipe, servings, availableStock);
    const purchases: Array<{ ingredientId: string; ingredientName: string; quantity: number }> = [];

    for (const check of checks) {
      if (!check.sufficient) {
        purchases.push({
          ingredientId: check.ingredientId,
          ingredientName: check.ingredientName,
          quantity: check.shortfall,
        });
      }
    }

    return purchases;
  }
}
