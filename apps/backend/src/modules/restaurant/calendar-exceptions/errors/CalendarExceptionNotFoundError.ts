import { AppError } from "../../../../errors/AppError.js";

export class CalendarExceptionNotFoundError extends AppError {
  constructor(id: string) {
    super(
      404,
      "calendar_exception.not_found",
      `Calendar exception '${id}' not found`,
    );
    this.name = "CalendarExceptionNotFoundError";
  }
}
