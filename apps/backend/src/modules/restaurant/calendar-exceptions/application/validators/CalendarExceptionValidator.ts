import type { CreateCalendarExceptionCommand } from "../commands/CreateCalendarExceptionCommand.js";
import type { UpdateCalendarExceptionCommand } from "../commands/UpdateCalendarExceptionCommand.js";
import { ExceptionDate } from "../../domain/models/ExceptionDate.js";
import { ExceptionType } from "../../domain/models/ExceptionType.js";
import { Priority } from "../../domain/models/Priority.js";
import { CalendarExceptionRules } from "../../domain/rules/CalendarExceptionRules.js";

export class CreateCalendarExceptionValidator {
  validate(command: CreateCalendarExceptionCommand, allowPast: boolean = false): void {
    if (!command.restaurantId) {
      throw new Error("restaurantId is required");
    }
    if (!command.title || command.title.trim().length === 0) {
      throw new Error("title is required");
    }
    if (command.title.length > 255) {
      throw new Error("title must not exceed 255 characters");
    }

    ExceptionType.create(command.type);
    ExceptionDate.create(command.date, allowPast);
    CalendarExceptionRules.validateTimesForNonClosed(command.isClosed, ExceptionType.reconstitute(command.type), command.openTime ?? null, command.closeTime ?? null);
    CalendarExceptionRules.validateClosedExceptionNoHours(command.isClosed, ExceptionType.reconstitute(command.type), command.openTime ?? null, command.closeTime ?? null);

    if (command.priority !== undefined) {
      Priority.create(command.priority);
    }
  }
}

export class UpdateCalendarExceptionValidator {
  validate(command: UpdateCalendarExceptionCommand, allowPast: boolean = false): void {
    if (!command.id) {
      throw new Error("id is required");
    }
    if (!command.title || command.title.trim().length === 0) {
      throw new Error("title is required");
    }
    if (command.title.length > 255) {
      throw new Error("title must not exceed 255 characters");
    }

    ExceptionType.create(command.type);
    ExceptionDate.create(command.date, allowPast);
    CalendarExceptionRules.validateTimesForNonClosed(command.isClosed, ExceptionType.reconstitute(command.type), command.openTime ?? null, command.closeTime ?? null);
    CalendarExceptionRules.validateClosedExceptionNoHours(command.isClosed, ExceptionType.reconstitute(command.type), command.openTime ?? null, command.closeTime ?? null);

    if (command.priority !== undefined) {
      Priority.create(command.priority);
    }
  }
}
