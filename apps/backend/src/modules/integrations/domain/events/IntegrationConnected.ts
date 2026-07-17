export class IntegrationConnected {
  constructor(
    public readonly integrationId: string,
    public readonly restaurantId: string,
    public readonly profileId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
