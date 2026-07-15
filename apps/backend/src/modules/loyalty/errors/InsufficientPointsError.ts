export class InsufficientPointsError extends Error {
  constructor(
    public readonly accountId: string,
    public readonly currentBalance: number,
    public readonly required: number,
  ) {
    super(`Insufficient points: balance ${currentBalance} < required ${required}`);
    this.name = "InsufficientPointsError";
  }
}
