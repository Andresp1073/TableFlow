export class PredictionRequested {
  constructor(
    public readonly jobId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly priority: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
