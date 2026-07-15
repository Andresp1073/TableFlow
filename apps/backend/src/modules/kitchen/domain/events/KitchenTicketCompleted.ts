export class KitchenTicketCompleted {
  public readonly eventName = "KitchenTicketCompleted";
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly restaurantId: string,
    public readonly stationId: string,
    public readonly totalTimeMs: number,
    public readonly preparationTimeMs: number,
  ) {
    this.occurredAt = new Date();
  }
}
