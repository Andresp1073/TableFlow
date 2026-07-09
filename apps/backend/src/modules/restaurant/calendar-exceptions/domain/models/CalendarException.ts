import type { ExceptionDate } from "./ExceptionDate.js";
import type { ExceptionType } from "./ExceptionType.js";
import type { OpeningPeriod } from "./OpeningPeriod.js";
import type { Priority } from "./Priority.js";

export interface CalendarException {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  type: ExceptionType;
  date: ExceptionDate;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  allDay: boolean;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}
