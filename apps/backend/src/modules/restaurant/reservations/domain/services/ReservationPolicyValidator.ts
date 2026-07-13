import type { PartySize } from "../models/PartySize.js";
import type { ReservationTimeRange } from "../models/ReservationTimeRange.js";
import type { ReservationSource } from "../models/ReservationSource.js";
import { ReservationPolicyViolationError } from "../../errors/ReservationPolicyViolationError.js";

export interface PolicyValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ReservationPolicyValidator {
  validatePartySize(partySize: PartySize): void {
    if (partySize.value < 1) {
      throw new ReservationPolicyViolationError("Party size must be at least 1");
    }
    if (partySize.isLargeParty()) {
      const largePartyThreshold = 8;
      // Large parties require special handling, flagged at policy level
    }
  }

  validateTimeRange(timeRange: ReservationTimeRange): void {
    if (timeRange.durationInMinutes() <= 0) {
      throw new ReservationPolicyViolationError(
        "Reservation end time must be after start time",
      );
    }
  }

  validateSource(source: ReservationSource): void {
    // All sources are valid; some may require additional verification
  }

  validateForCreation(
    partySize: PartySize,
    timeRange: ReservationTimeRange,
    source: ReservationSource,
  ): PolicyValidationResult {
    const errors: string[] = [];

    if (partySize.value < 1) {
      errors.push("Party size must be at least 1");
    }

    if (timeRange.durationInMinutes() <= 0) {
      errors.push("End time must be after start time");
    }

    return { isValid: errors.length === 0, errors };
  }
}
