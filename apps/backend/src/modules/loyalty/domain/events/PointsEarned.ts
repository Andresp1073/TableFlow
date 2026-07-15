export class PointsEarned {
  constructor(
    public readonly transactionId: string,
    public readonly accountId: string,
    public readonly customerProfileId: string,
    public readonly restaurantId: string,
    public readonly points: number,
    public readonly balanceAfter: number,
    public readonly referenceId: string,
    public readonly referenceType: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
