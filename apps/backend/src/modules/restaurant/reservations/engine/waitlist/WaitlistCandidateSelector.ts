import type { WaitlistEntry } from "./WaitlistEntry.js";
import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import { WaitlistPriorityCalculator } from "./WaitlistPriorityCalculator.js";
import { WaitlistEligibilityPolicy } from "./WaitlistEligibilityPolicy.js";

export interface CandidateSelectionResult {
  selected: WaitlistEntry | null;
  reason: string | null;
  candidates: WaitlistEntry[];
}

export class WaitlistCandidateSelector {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly priorityCalculator: WaitlistPriorityCalculator = new WaitlistPriorityCalculator(),
    private readonly eligibilityPolicy: WaitlistEligibilityPolicy = new WaitlistEligibilityPolicy(),
  ) {}

  async selectBestCandidate(entries: WaitlistEntry[]): Promise<CandidateSelectionResult> {
    if (entries.length === 0) {
      return { selected: null, reason: "No candidates available", candidates: [] };
    }

    const eligibleEntries = entries.filter((e) => {
      const result = this.eligibilityPolicy.isEligibleForPromotion(e);
      return result.eligible;
    });

    if (eligibleEntries.length === 0) {
      return { selected: null, reason: "No eligible candidates", candidates: [] };
    }

    const sorted = this.priorityCalculator.sortByPriority(eligibleEntries);

    for (const candidate of sorted) {
      const availabilityResult = await this.availabilityService.checkAvailability({
        restaurantId: candidate.restaurantId,
        date: candidate.requestedDate.toISOString(),
        startTime: candidate.requestedStartTime.toISOString(),
        endTime: candidate.requestedEndTime.toISOString(),
        partySize: candidate.partySize,
      });

      if (availabilityResult.available) {
        return {
          selected: candidate,
          reason: null,
          candidates: sorted,
        };
      }
    }

    return {
      selected: null,
      reason: "No candidates with availability",
      candidates: sorted,
    };
  }

  async findCandidatesForTimeSlot(
    entries: WaitlistEntry[],
    partySize: number,
    startTime: Date,
    endTime: Date,
  ): Promise<CandidateSelectionResult> {
    const matchingEntries = entries.filter((e) => {
      if (!e.status.isActive()) return false;

      const sizeOk = Math.abs(e.partySize - partySize) <= 2;
      if (!sizeOk) return false;

      return true;
    });

    return this.selectBestCandidate(matchingEntries);
  }
}
