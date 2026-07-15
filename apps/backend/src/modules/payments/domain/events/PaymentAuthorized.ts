export class PaymentAuthorized {
  public readonly eventName = "PaymentAuthorized";
  public readonly occurredAt: Date;

  constructor(
    public readonly transactionId: string,
    public readonly intentId: string,
    public readonly providerId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly authorizationCode: string,
    public readonly providerReference: string,
  ) {
    this.occurredAt = new Date();
  }
}
