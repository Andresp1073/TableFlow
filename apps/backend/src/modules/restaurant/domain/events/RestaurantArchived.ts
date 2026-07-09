export class RestaurantArchived {
  public readonly eventName = "RestaurantArchived";
  public readonly occurredAt: Date;

  constructor(
    public readonly restaurantId: string,
    public readonly previousStatus: string,
    public readonly deletedBy?: string,
  ) {
    this.occurredAt = new Date();
  }
}
