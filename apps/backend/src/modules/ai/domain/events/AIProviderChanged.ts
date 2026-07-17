export class AIProviderChanged {
  constructor(
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
