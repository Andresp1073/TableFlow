import { randomUUID } from "node:crypto";
import type { CalendarException } from "../../domain/models/CalendarException.js";
import type { CalendarExceptionFactory, CreateCalendarExceptionData, ReconstituteCalendarExceptionData } from "../../domain/repositories/CalendarExceptionFactory.js";
import { ExceptionDate } from "../../domain/models/ExceptionDate.js";
import { ExceptionType } from "../../domain/models/ExceptionType.js";
import { Priority } from "../../domain/models/Priority.js";

export class ConcreteCalendarExceptionFactory implements CalendarExceptionFactory {
  create(data: CreateCalendarExceptionData): CalendarException {
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      title: data.title,
      description: data.description,
      type: data.type,
      date: data.date,
      isClosed: data.isClosed,
      openTime: data.openTime,
      closeTime: data.closeTime,
      allDay: data.allDay,
      priority: data.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  reconstitute(data: ReconstituteCalendarExceptionData): CalendarException {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      title: data.title,
      description: data.description,
      type: ExceptionType.reconstitute(data.type),
      date: ExceptionDate.reconstitute(data.date),
      isClosed: data.isClosed,
      openTime: data.openTime,
      closeTime: data.closeTime,
      allDay: data.allDay,
      priority: Priority.reconstitute(data.priority),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
