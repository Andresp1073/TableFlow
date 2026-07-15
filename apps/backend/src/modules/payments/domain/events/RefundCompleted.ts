export class RefundCompleted {
  public readonly eventName = "RefundCompleted";
  public readonly occurredAt: Date;

  constructor(
    public readonly refundId: string,
    public readonly transactionId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly providerReference: string,
  ) {
    this.occurredAt = new Date();
  }
}
