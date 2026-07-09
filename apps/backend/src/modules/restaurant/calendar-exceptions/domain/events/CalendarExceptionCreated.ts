import { randomUUID } from "node:crypto";

export class CalendarExceptionCreated {
  public readonly eventName = "CalendarExceptionCreated";
  public readonly id: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly calendarExceptionId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly date: string,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }
}
