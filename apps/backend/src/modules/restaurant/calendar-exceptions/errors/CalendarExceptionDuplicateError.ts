import { AppError } from "../../../../errors/AppError.js";

export class CalendarExceptionDuplicateError extends AppError {
  constructor(date: string, type: string) {
    super(
      409,
      "calendar_exception.duplicate",
      `A calendar exception of type '${type}' already exists on '${date}'`,
    );
    this.name = "CalendarExceptionDuplicateError";
  }
}
