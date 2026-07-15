export class PaymentFailed {
  public readonly eventName = "PaymentFailed";
  public readonly occurredAt: Date;

  constructor(
    public readonly transactionId: string,
    public readonly intentId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly errorMessage: string,
    public readonly errorCode: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
