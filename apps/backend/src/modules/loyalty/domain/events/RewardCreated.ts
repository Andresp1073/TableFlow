export class RewardCreated {
  constructor(
    public readonly rewardId: string,
    public readonly programId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly costInPoints: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
