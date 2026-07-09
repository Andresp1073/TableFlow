import { ExceptionType } from "../models/ExceptionType.js";
import { OpeningPeriod } from "../models/OpeningPeriod.js";
import { CalendarExceptionDuplicateError } from "../../errors/CalendarExceptionDuplicateError.js";

export class CalendarExceptionRules {
  static validateClosedExceptionNoHours(isClosed: boolean, type: ExceptionType, openTime: string | null, closeTime: string | null): void {
    if (isClosed && (openTime !== null || closeTime !== null)) {
      throw new Error("A closed exception cannot contain opening hours");
    }

    if (isClosed && !type.isClosure()) {
      if (type.value !== ExceptionType.HOLIDAY && type.value !== ExceptionType.PRIVATE_EVENT) {
        return;
      }
    }
  }

  static validateOpenTimeBeforeCloseTime(openTime: string, closeTime: string): void {
    OpeningPeriod.create(openTime, closeTime);
  }

  static validateTimesForNonClosed(isClosed: boolean, type: ExceptionType, openTime: string | null, closeTime: string | null): void {
    if (!isClosed) {
      if (!openTime || !closeTime) {
        throw new Error("Open time and close time are required when the exception is not closed");
      }
      this.validateOpenTimeBeforeCloseTime(openTime, closeTime);
    }
  }

  static validateExceptionNotDuplicate(existingId: string | null, date: string, type: string): void {
    if (existingId) {
      throw new CalendarExceptionDuplicateError(date, type);
    }
  }
}
