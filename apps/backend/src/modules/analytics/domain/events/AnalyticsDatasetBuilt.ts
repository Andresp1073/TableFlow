export class AnalyticsDatasetBuilt {
  constructor(
    public readonly datasetId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly dimensions: string[],
    public readonly metrics: string[],
    public readonly recordCount: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
