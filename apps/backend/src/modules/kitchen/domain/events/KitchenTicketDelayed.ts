export class KitchenTicketDelayed {
  public readonly eventName = "KitchenTicketDelayed";
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly restaurantId: string,
    public readonly stationId: string,
    public readonly delayMs: number,
    public readonly slaMs: number,
  ) {
    this.occurredAt = new Date();
  }
}
