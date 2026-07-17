export class MetricCalculated {
  constructor(
    public readonly metricId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly category: string,
    public readonly value: number,
    public readonly unit: string,
    public readonly period: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
