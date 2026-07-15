export class PurchaseReceived {
  public readonly eventName = "PurchaseReceived";
  public readonly occurredAt: Date;

  constructor(
    public readonly purchaseOrderId: string,
    public readonly restaurantId: string,
    public readonly supplierId: string,
    public readonly itemsReceived: number,
  ) {
    this.occurredAt = new Date();
  }
}
