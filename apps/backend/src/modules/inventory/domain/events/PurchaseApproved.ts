export class PurchaseApproved {
  public readonly eventName = "PurchaseApproved";
  public readonly occurredAt: Date;

  constructor(
    public readonly purchaseOrderId: string,
    public readonly restaurantId: string,
    public readonly approvedBy: string,
    public readonly totalAmount: number,
  ) {
    this.occurredAt = new Date();
  }
}
