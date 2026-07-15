export class RewardError extends Error {
  constructor(
    message: string,
    public readonly rewardId?: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "RewardError";
  }
}
