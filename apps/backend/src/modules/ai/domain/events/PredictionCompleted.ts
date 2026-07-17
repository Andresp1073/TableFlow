export class PredictionCompleted {
  constructor(
    public readonly jobId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly success: boolean,
    public readonly processingTimeMs: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
