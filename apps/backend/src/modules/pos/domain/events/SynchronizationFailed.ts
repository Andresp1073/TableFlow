export class SynchronizationFailed {
  public readonly eventName = "SynchronizationFailed";
  public readonly occurredAt: Date;

  constructor(
    public readonly connectionId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly synchronizationId: string,
    public readonly direction: string,
    public readonly errorMessage: string,
    public readonly attemptCount: number,
  ) {
    this.occurredAt = new Date();
  }
}
