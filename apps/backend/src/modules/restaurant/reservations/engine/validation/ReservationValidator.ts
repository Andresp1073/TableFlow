import type { CreateReservationCommand } from "../../application/commands/CreateReservationCommand.js";
import type { UpdateReservationCommand } from "../../application/commands/UpdateReservationCommand.js";
import type { Reservation } from "../../domain/models/Reservation.js";
import type { ValidationResult } from "../types.js";

export class ReservationValidator {
  validateCreate(command: CreateReservationCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.restaurantId || command.restaurantId.trim() === "") {
      errors.push("restaurantId is required");
    }

    if (!command.reservationNumber || command.reservationNumber.trim() === "") {
      errors.push("reservationNumber is required");
    }

    if (!command.date) {
      errors.push("date is required");
    }

    if (!command.startTime) {
      errors.push("startTime is required");
    }

    if (!command.endTime) {
      errors.push("endTime is required");
    }

    if (!command.partySize || command.partySize < 1) {
      errors.push("partySize must be at least 1");
    }

    if (command.partySize > 100) {
      errors.push("partySize must not exceed 100");
    }

    if (!command.source || command.source.trim() === "") {
      errors.push("source is required");
    }

    if (command.startTime && command.endTime) {
      const start = new Date(command.startTime);
      const end = new Date(command.endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() <= start.getTime()) {
        errors.push("endTime must be after startTime");
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  validateUpdate(
    command: UpdateReservationCommand,
    existing: Reservation,
  ): ValidationResult {
    const errors: string[] = [];

    if (existing.status.isTerminal()) {
      errors.push(`Cannot update a reservation in terminal status "${existing.status.value}"`);
    }

    if (command.partySize !== undefined) {
      if (command.partySize < 1) {
        errors.push("partySize must be at least 1");
      }
      if (command.partySize > 100) {
        errors.push("partySize must not exceed 100");
      }
    }

    if (command.startTime && command.endTime) {
      const start = new Date(command.startTime);
      const end = new Date(command.endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() <= start.getTime()) {
        errors.push("endTime must be after startTime");
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
