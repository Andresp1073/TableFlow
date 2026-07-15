export class RevenueStrategyError extends Error {
  constructor(message: string, public readonly strategyId?: string, public readonly code?: string) {
    super(message);
    this.name = "RevenueStrategyError";
  }
}
