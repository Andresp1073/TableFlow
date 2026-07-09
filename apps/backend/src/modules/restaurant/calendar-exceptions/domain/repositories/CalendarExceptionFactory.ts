import type { CalendarException } from "../models/CalendarException.js";
import type { ExceptionDate } from "../models/ExceptionDate.js";
import type { ExceptionType } from "../models/ExceptionType.js";
import type { Priority } from "../models/Priority.js";

export interface CreateCalendarExceptionData {
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
}

export interface ReconstituteCalendarExceptionData {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  allDay: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarExceptionFactory {
  create(data: CreateCalendarExceptionData): CalendarException;
  reconstitute(data: ReconstituteCalendarExceptionData): CalendarException;
}
