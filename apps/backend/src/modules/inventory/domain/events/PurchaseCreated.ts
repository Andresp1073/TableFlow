export class PurchaseCreated {
  public readonly eventName = "PurchaseCreated";
  public readonly occurredAt: Date;

  constructor(
    public readonly purchaseOrderId: string,
    public readonly restaurantId: string,
    public readonly supplierId: string,
    public readonly totalAmount: number,
    public readonly itemCount: number,
  ) {
    this.occurredAt = new Date();
  }
}
