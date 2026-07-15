export class InventoryExpired {
  public readonly eventName = "InventoryExpired";
  public readonly occurredAt: Date;

  constructor(
    public readonly stockItemId: string,
    public readonly ingredientId: string,
    public readonly ingredientName: string,
    public readonly restaurantId: string,
    public readonly quantity: number,
    public readonly batchCode: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
