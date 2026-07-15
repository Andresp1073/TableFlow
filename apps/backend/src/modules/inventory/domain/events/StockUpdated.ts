export class StockUpdated {
  public readonly eventName = "StockUpdated";
  public readonly occurredAt: Date;

  constructor(
    public readonly stockItemId: string,
    public readonly ingredientId: string,
    public readonly restaurantId: string,
    public readonly previousQuantity: number,
    public readonly newQuantity: number,
    public readonly movementType: string,
  ) {
    this.occurredAt = new Date();
  }
}
