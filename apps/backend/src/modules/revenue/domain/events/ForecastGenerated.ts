export class ForecastGenerated {
  constructor(
    public readonly forecastId: string,
    public readonly restaurantId: string,
    public readonly date: string,
    public readonly timeSlot: string,
    public readonly predictedOccupancy: number,
    public readonly predictedRevenue: number,
    public readonly confidence: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
