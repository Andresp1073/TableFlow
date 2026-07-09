export class RestaurantActivated {
  public readonly eventName = "RestaurantActivated";
  public readonly occurredAt: Date;

  constructor(
    public readonly restaurantId: string,
    public readonly previousStatus: string,
  ) {
    this.occurredAt = new Date();
  }
}
