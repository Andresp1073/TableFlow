export class SynchronizationRequested {
  constructor(
    public readonly integrationId: string,
    public readonly restaurantId: string,
    public readonly contextId: string,
    public readonly capability: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
