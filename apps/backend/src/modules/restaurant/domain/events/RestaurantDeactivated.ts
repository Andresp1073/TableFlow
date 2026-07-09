export class RestaurantDeactivated {
  public readonly eventName = "RestaurantDeactivated";
  public readonly occurredAt: Date;

  constructor(
    public readonly restaurantId: string,
    public readonly previousStatus: string,
  ) {
    this.occurredAt = new Date();
  }
}
