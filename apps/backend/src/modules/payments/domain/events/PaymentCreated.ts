export class PaymentCreated {
  public readonly eventName = "PaymentCreated";
  public readonly occurredAt: Date;

  constructor(
    public readonly transactionId: string,
    public readonly intentId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly methodType: string,
  ) {
    this.occurredAt = new Date();
  }
}
