export class KitchenTicketCancelled {
  public readonly eventName = "KitchenTicketCancelled";
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly restaurantId: string,
    public readonly stationId: string,
    public readonly reason: string,
  ) {
    this.occurredAt = new Date();
  }
}
