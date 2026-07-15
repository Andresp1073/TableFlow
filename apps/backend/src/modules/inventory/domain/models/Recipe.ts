import type { IngredientUnit } from "./Ingredient.js";

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  wastePercent: number;
}

export interface RecipeConfig {
  id: string;
  restaurantId: string;
  name: string;
  menuItemId?: string;
  servings: number;
  ingredients: RecipeIngredient[];
  preparationNotes?: string;
  estimatedPrepTimeMinutes: number;
  isActive: boolean;
}

export class Recipe {
  private constructor(public readonly value: RecipeConfig) {}

  static create(config: RecipeConfig): Recipe {
    if (!config.id.trim()) throw new Error("Recipe ID cannot be empty");
    if (!config.name.trim()) throw new Error("Recipe name cannot be empty");
    if (config.servings < 1) throw new Error("Servings must be at least 1");
    return new Recipe({ ...config, ingredients: config.ingredients.map((i) => ({ ...i })) });
  }

  static reconstitute(config: RecipeConfig): Recipe {
    return new Recipe(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get name(): string { return this.value.name; }
  get menuItemId(): string | undefined { return this.value.menuItemId; }
  get servings(): number { return this.value.servings; }
  get ingredients(): readonly RecipeIngredient[] { return this.value.ingredients; }
  get preparationNotes(): string | undefined { return this.value.preparationNotes; }
  get estimatedPrepTimeMinutes(): number { return this.value.estimatedPrepTimeMinutes; }
  get isActive(): boolean { return this.value.isActive; }

  equals(other: Recipe): boolean { return this.value.id === other.value.id; }

  calculateIngredientCost(ingredientCosts: Map<string, number>): number {
    let total = 0;
    for (const ingredient of this.value.ingredients) {
      const cost = ingredientCosts.get(ingredient.ingredientId) ?? 0;
      const withWaste = ingredient.quantity * (1 + ingredient.wastePercent / 100);
      total += withWaste * cost;
    }
    return total;
  }

  calculateCostPerServing(ingredientCosts: Map<string, number>): number {
    return this.calculateIngredientCost(ingredientCosts) / this.value.servings;
  }

  scaleIngredients(targetServings: number): RecipeIngredient[] {
    const ratio = targetServings / this.value.servings;
    return this.value.ingredients.map((i) => ({
      ...i,
      quantity: i.quantity * ratio,
    }));
  }

  getRequiredIngredients(quantity: number): Map<string, number> {
    const required = new Map<string, number>();
    for (const ingredient of this.value.ingredients) {
      const totalQty = ingredient.quantity * quantity;
      const withWaste = totalQty * (1 + ingredient.wastePercent / 100);
      required.set(ingredient.ingredientId, withWaste);
    }
    return required;
  }

  deactivate(): Recipe { return Recipe.reconstitute({ ...this.value, isActive: false }); }
  activate(): Recipe { return Recipe.reconstitute({ ...this.value, isActive: true }); }
}
