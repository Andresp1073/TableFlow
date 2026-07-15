export class PricingRuleError extends Error {
  constructor(message: string, public readonly ruleId?: string, public readonly code?: string) {
    super(message);
    this.name = "PricingRuleError";
  }
}
