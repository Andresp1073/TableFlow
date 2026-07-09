import { randomUUID } from "node:crypto";

export class BusinessHoursUpdated {
  public readonly eventName = "BusinessHoursUpdated";
  public readonly id: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly businessHoursId: string,
    public readonly restaurantId: string,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }
}
