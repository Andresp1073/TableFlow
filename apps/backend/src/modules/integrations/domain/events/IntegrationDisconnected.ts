export class IntegrationDisconnected {
  constructor(
    public readonly integrationId: string,
    public readonly restaurantId: string,
    public readonly profileId: string,
    public readonly reason?: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
