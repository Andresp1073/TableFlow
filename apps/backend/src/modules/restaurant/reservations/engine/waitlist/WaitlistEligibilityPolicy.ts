import type { WaitlistEntry } from "./WaitlistEntry.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";

export interface EligibilityResult {
  eligible: boolean;
  reason: string | null;
}

export class WaitlistEligibilityPolicy {
  canAddToWaitlist(
    partySize: number,
    startTime: Date,
    endTime: Date,
  ): EligibilityResult {
    if (partySize < 1) {
      return { eligible: false, reason: "Party size must be at least 1" };
    }

    if (partySize > 100) {
      return { eligible: false, reason: "Party size must not exceed 100" };
    }

    try {
      PartySize.create(partySize);
    } catch {
      return { eligible: false, reason: `Party size ${partySize} is invalid` };
    }

    try {
      ReservationTimeRange.create(startTime, endTime);
    } catch {
      return { eligible: false, reason: "Invalid reservation time range" };
    }

    const now = new Date();
    if (endTime.getTime() <= now.getTime()) {
      return { eligible: false, reason: "Requested time is in the past" };
    }

    return { eligible: true, reason: null };
  }

  isEligibleForPromotion(entry: WaitlistEntry): EligibilityResult {
    if (!entry.status.isActive()) {
      return {
        eligible: false,
        reason: `Entry is in terminal status "${entry.status.value}"`,
      };
    }

    if (entry.status.isWaiting()) {
      return { eligible: true, reason: null };
    }

    const now = new Date();
    if (entry.requestedEndTime.getTime() <= now.getTime()) {
      return { eligible: false, reason: "Requested time slot has passed" };
    }

    return { eligible: true, reason: null };
  }

  canExtendWaitlist(entry: WaitlistEntry, newEndTime: Date): EligibilityResult {
    if (entry.status.isTerminal()) {
      return {
        eligible: false,
        reason: `Cannot extend a ${entry.status.value} waitlist entry`,
      };
    }

    const now = new Date();
    if (newEndTime.getTime() <= now.getTime()) {
      return { eligible: false, reason: "Extension time must be in the future" };
    }

    if (newEndTime.getTime() <= entry.requestedEndTime.getTime()) {
      return { eligible: false, reason: "Extension time must be after the current end time" };
    }

    return { eligible: true, reason: null };
  }
}
