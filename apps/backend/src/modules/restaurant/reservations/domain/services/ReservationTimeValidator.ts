import type { ReservationDate } from "../models/ReservationDate.js";
import type { ReservationTimeRange } from "../models/ReservationTimeRange.js";
import { InvalidReservationDateError } from "../../errors/InvalidReservationDateError.js";
import { InvalidReservationTimeError } from "../../errors/InvalidReservationTimeError.js";

export interface TimeValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ReservationTimeValidator {
  validateDate(date: ReservationDate): void {
    if (!date || !date.value || isNaN(date.value.getTime())) {
      throw new InvalidReservationDateError("Reservation date must be a valid date");
    }
  }

  validateTimeRange(timeRange: ReservationTimeRange): void {
    if (!timeRange.startTime || !timeRange.endTime) {
      throw new InvalidReservationTimeError("Start time and end time are required");
    }

    if (isNaN(timeRange.startTime.getTime()) || isNaN(timeRange.endTime.getTime())) {
      throw new InvalidReservationTimeError("Start and end times must be valid dates");
    }

    if (timeRange.endTime.getTime() <= timeRange.startTime.getTime()) {
      throw new InvalidReservationTimeError("End time must be after start time");
    }
  }

  validateNotInPast(date: ReservationDate): void {
    const now = new Date();
    const inputDate = new Date(date.value);
    inputDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (inputDate.getTime() < today.getTime()) {
      throw new InvalidReservationDateError("Reservation date cannot be in the past");
    }
  }

  validateDuration(timeRange: ReservationTimeRange, maxDurationMinutes: number): void {
    const duration = timeRange.durationInMinutes();
    if (duration > maxDurationMinutes) {
      throw new InvalidReservationTimeError(
        `Reservation duration exceeds maximum of ${maxDurationMinutes} minutes`,
      );
    }
  }

  validateForCreation(
    date: ReservationDate,
    timeRange: ReservationTimeRange,
  ): TimeValidationResult {
    const errors: string[] = [];

    if (!date || !date.value || isNaN(date.value.getTime())) {
      errors.push("Reservation date must be a valid date");
    }

    if (!timeRange.startTime || !timeRange.endTime) {
      errors.push("Start time and end time are required");
    } else {
      if (isNaN(timeRange.startTime.getTime()) || isNaN(timeRange.endTime.getTime())) {
        errors.push("Start and end times must be valid dates");
      }
      if (timeRange.endTime.getTime() <= timeRange.startTime.getTime()) {
        errors.push("End time must be after start time");
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
