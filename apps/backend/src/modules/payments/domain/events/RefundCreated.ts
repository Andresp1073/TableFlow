export class RefundCreated {
  public readonly eventName = "RefundCreated";
  public readonly occurredAt: Date;

  constructor(
    public readonly refundId: string,
    public readonly transactionId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly type: string,
    public readonly reason: string | null,
    public readonly requestedBy: string,
    public readonly requiresApproval: boolean,
  ) {
    this.occurredAt = new Date();
  }
}
