export class RestaurantCreated {
  public readonly eventName = "RestaurantCreated";
  public readonly occurredAt: Date;

  constructor(
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly slug: string,
  ) {
    this.occurredAt = new Date();
  }
}
