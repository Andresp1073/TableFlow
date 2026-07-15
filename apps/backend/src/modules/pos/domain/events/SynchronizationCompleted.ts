export class SynchronizationCompleted {
  public readonly eventName = "SynchronizationCompleted";
  public readonly occurredAt: Date;

  constructor(
    public readonly connectionId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly synchronizationId: string,
    public readonly direction: string,
    public readonly recordsProcessed: number,
    public readonly durationMs: number,
  ) {
    this.occurredAt = new Date();
  }
}
