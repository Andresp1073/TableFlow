export class IngredientConsumed {
  public readonly eventName = "IngredientConsumed";
  public readonly occurredAt: Date;

  constructor(
    public readonly ingredientId: string,
    public readonly ingredientName: string,
    public readonly restaurantId: string,
    public readonly recipeId: string,
    public readonly quantity: number,
    public readonly unit: string,
  ) {
    this.occurredAt = new Date();
  }
}
