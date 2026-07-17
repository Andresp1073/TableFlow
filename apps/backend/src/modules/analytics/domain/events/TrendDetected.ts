export class TrendDetected {
  constructor(
    public readonly restaurantId: string,
    public readonly metricName: string,
    public readonly trend: string,
    public readonly currentValue: number,
    public readonly previousValue: number,
    public readonly changePercent: number,
    public readonly period: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
