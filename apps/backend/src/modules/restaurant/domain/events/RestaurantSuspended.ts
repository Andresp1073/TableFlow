export class RestaurantSuspended {
  public readonly eventName = "RestaurantSuspended";
  public readonly occurredAt: Date;

  constructor(
    public readonly restaurantId: string,
    public readonly reason?: string,
  ) {
    this.occurredAt = new Date();
  }
}
