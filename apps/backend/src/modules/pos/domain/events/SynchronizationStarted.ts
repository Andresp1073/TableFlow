export class SynchronizationStarted {
  public readonly eventName = "SynchronizationStarted";
  public readonly occurredAt: Date;

  constructor(
    public readonly connectionId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly synchronizationId: string,
    public readonly direction: string,
  ) {
    this.occurredAt = new Date();
  }
}
