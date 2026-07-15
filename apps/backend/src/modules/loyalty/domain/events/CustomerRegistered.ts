export class CustomerRegistered {
  constructor(
    public readonly customerProfileId: string,
    public readonly customerId: string,
    public readonly restaurantId: string,
    public readonly email: string,
    public readonly programId: string,
    public readonly accountId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
