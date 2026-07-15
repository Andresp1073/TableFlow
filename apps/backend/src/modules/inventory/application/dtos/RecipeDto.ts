export interface CreateRecipeDto {
  name: string;
  menuItemId?: string;
  servings: number;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    wastePercent?: number;
  }>;
  preparationNotes?: string;
  estimatedPrepTimeMinutes: number;
}

export interface RecipeResponseDto {
  id: string;
  name: string;
  servings: number;
  ingredientCount: number;
  estimatedPrepTimeMinutes: number;
  isActive: boolean;
}
