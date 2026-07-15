export class LoyaltyProgramError extends Error {
  constructor(
    message: string,
    public readonly programId?: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "LoyaltyProgramError";
  }
}
