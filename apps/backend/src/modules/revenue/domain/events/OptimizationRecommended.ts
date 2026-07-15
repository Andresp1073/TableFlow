export class OptimizationRecommended {
  constructor(
    public readonly recommendationId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly priority: string,
    public readonly title: string,
    public readonly estimatedRevenueImpact: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
