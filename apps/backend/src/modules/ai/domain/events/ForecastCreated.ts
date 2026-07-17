export class ForecastCreated {
  constructor(
    public readonly forecastId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly value: number,
    public readonly unit: string,
    public readonly confidence: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
