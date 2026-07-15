export class RewardRedeemed {
  constructor(
    public readonly redemptionId: string,
    public readonly rewardId: string,
    public readonly rewardName: string,
    public readonly customerProfileId: string,
    public readonly restaurantId: string,
    public readonly pointsCost: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
