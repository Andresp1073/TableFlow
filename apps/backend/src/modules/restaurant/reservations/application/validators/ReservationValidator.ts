import type { CreateReservationRequest, UpdateReservationRequest } from "../dto/ReservationRequestDTO.js";
import { ReservationPolicyViolationError } from "../../errors/ReservationPolicyViolationError.js";

export class ReservationValidator {
  validateCreateRequest(request: CreateReservationRequest): void {
    if (!request.restaurantId || request.restaurantId.trim() === "") {
      throw new ReservationPolicyViolationError("restaurantId is required");
    }

    if (!request.reservationNumber || request.reservationNumber.trim() === "") {
      throw new ReservationPolicyViolationError("reservationNumber is required");
    }

    if (!request.date) {
      throw new ReservationPolicyViolationError("date is required");
    }

    if (!request.startTime) {
      throw new ReservationPolicyViolationError("startTime is required");
    }

    if (!request.endTime) {
      throw new ReservationPolicyViolationError("endTime is required");
    }

    if (!request.partySize || request.partySize < 1) {
      throw new ReservationPolicyViolationError("partySize must be at least 1");
    }

    if (request.partySize > 100) {
      throw new ReservationPolicyViolationError("partySize must not exceed 100");
    }

    if (!request.source || request.source.trim() === "") {
      throw new ReservationPolicyViolationError("source is required");
    }

    if (request.startTime && request.endTime) {
      const start = new Date(request.startTime);
      const end = new Date(request.endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() <= start.getTime()) {
        throw new ReservationPolicyViolationError("endTime must be after startTime");
      }
    }
  }

  validateUpdateRequest(request: UpdateReservationRequest): void {
    if (request.partySize !== undefined) {
      if (request.partySize < 1) {
        throw new ReservationPolicyViolationError("partySize must be at least 1");
      }
      if (request.partySize > 100) {
        throw new ReservationPolicyViolationError("partySize must not exceed 100");
      }
    }

    if (request.startTime && request.endTime) {
      const start = new Date(request.startTime);
      const end = new Date(request.endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() <= start.getTime()) {
        throw new ReservationPolicyViolationError("endTime must be after startTime");
      }
    }
  }
}
