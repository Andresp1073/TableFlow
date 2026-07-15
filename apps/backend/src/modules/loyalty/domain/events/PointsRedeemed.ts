export class PointsRedeemed {
  constructor(
    public readonly transactionId: string,
    public readonly redemptionId: string,
    public readonly accountId: string,
    public readonly customerProfileId: string,
    public readonly restaurantId: string,
    public readonly points: number,
    public readonly rewardId: string,
    public readonly balanceAfter: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
