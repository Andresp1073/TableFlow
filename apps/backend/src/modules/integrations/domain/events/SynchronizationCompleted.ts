export class SynchronizationCompleted {
  constructor(
    public readonly integrationId: string,
    public readonly restaurantId: string,
    public readonly contextId: string,
    public readonly capability: string,
    public readonly success: boolean,
    public readonly recordsProcessed: number,
    public readonly processingTimeMs: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
