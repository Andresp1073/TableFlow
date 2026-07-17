export class RecommendationGenerated {
  constructor(
    public readonly recommendationId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly priority: string,
    public readonly title: string,
    public readonly confidence: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
