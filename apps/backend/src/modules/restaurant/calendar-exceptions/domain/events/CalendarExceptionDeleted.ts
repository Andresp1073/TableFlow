import { randomUUID } from "node:crypto";

export class CalendarExceptionDeleted {
  public readonly eventName = "CalendarExceptionDeleted";
  public readonly id: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly calendarExceptionId: string,
    public readonly restaurantId: string,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }
}
