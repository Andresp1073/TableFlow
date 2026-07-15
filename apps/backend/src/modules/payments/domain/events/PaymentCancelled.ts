export class PaymentCancelled {
  public readonly eventName = "PaymentCancelled";
  public readonly occurredAt: Date;

  constructor(
    public readonly transactionId: string,
    public readonly intentId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly reason: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
