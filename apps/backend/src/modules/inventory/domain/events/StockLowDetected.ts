export class StockLowDetected {
  public readonly eventName = "StockLowDetected";
  public readonly occurredAt: Date;

  constructor(
    public readonly ingredientId: string,
    public readonly ingredientName: string,
    public readonly restaurantId: string,
    public readonly currentStock: number,
    public readonly reorderPoint: number,
  ) {
    this.occurredAt = new Date();
  }
}
