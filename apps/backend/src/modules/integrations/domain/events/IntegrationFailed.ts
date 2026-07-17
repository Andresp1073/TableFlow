export class IntegrationFailed {
  constructor(
    public readonly integrationId: string,
    public readonly restaurantId: string,
    public readonly error: string,
    public readonly contextId?: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
