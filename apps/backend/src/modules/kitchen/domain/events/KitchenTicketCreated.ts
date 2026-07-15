export class KitchenTicketCreated {
  public readonly eventName = "KitchenTicketCreated";
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly restaurantId: string,
    public readonly kitchenId: string,
    public readonly orderId: string,
    public readonly stationId: string,
    public readonly priority: string,
    public readonly itemCount: number,
  ) {
    this.occurredAt = new Date();
  }
}
