export class IntegrationCreated {
  constructor(
    public readonly integrationId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
