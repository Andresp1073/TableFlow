export class KitchenTicketStarted {
  public readonly eventName = "KitchenTicketStarted";
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly restaurantId: string,
    public readonly stationId: string,
    public readonly priority: string,
    public readonly waitingTimeMs: number,
  ) {
    this.occurredAt = new Date();
  }
}
