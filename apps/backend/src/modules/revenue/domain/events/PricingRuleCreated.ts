export class PricingRuleCreated {
  constructor(
    public readonly ruleId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly conditions: Record<string, unknown>,
    public readonly priceMultiplier: number,
    public readonly priority: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
