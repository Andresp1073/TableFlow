import type { WaitlistRepository } from "./WaitlistRepository.js";
import type { WaitlistEntry } from "./WaitlistEntry.js";
import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import { WaitlistStatus } from "./WaitlistStatus.js";
import { WaitlistCandidateSelector } from "./WaitlistCandidateSelector.js";
import { WaitlistEligibilityPolicy } from "./WaitlistEligibilityPolicy.js";
import { WaitlistPriorityCalculator } from "./WaitlistPriorityCalculator.js";

export interface PromotionResult {
  promoted: boolean;
  entry: WaitlistEntry | null;
  reason: string | null;
  candidates: WaitlistEntry[];
}

export class WaitlistPromotionCoordinator {
  constructor(
    private readonly repository: WaitlistRepository,
    private readonly candidateSelector: WaitlistCandidateSelector,
    private readonly eligibilityPolicy: WaitlistEligibilityPolicy = new WaitlistEligibilityPolicy(),
    private readonly priorityCalculator: WaitlistPriorityCalculator = new WaitlistPriorityCalculator(),
  ) {}

  async promoteNext(restaurantId: string): Promise<PromotionResult> {
    const activeEntries = await this.repository.findByStatus(restaurantId, "waiting");

    if (activeEntries.length === 0) {
      return { promoted: false, entry: null, reason: "No waitlist entries", candidates: [] };
    }

    const eligibleEntries = activeEntries.filter((e) => {
      const isEligible = this.eligibilityPolicy.isEligibleForPromotion(e);
      return isEligible.eligible;
    });

    if (eligibleEntries.length === 0) {
      return { promoted: false, entry: null, reason: "No eligible entries", candidates: [] };
    }

    const selection = await this.candidateSelector.selectBestCandidate(eligibleEntries);

    if (!selection.selected) {
      const sortedCandidates = this.priorityCalculator.sortByPriority(eligibleEntries);
      return {
        promoted: false,
        entry: null,
        reason: selection.reason ?? "No candidate selected",
        candidates: sortedCandidates,
      };
    }

    const promoted = selection.selected;

    await this.markAsEligible(promoted);

    const updatedEntry: WaitlistEntry = {
      ...promoted,
      status: WaitlistStatus.create("promoted"),
      promotedAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updatedEntry);

    return {
      promoted: true,
      entry: saved,
      reason: null,
      candidates: selection.candidates,
    };
  }

  async preparePromotion(entry: WaitlistEntry): Promise<PromotionResult> {
    const eligibility = this.eligibilityPolicy.isEligibleForPromotion(entry);
    if (!eligibility.eligible) {
      return {
        promoted: false,
        entry: null,
        reason: eligibility.reason,
        candidates: [],
      };
    }

    const marked = await this.markAsEligible(entry);

    return {
      promoted: false,
      entry: marked,
      reason: "Ready for promotion",
      candidates: [marked],
    };
  }

  async findNextCandidates(restaurantId: string, limit = 5): Promise<WaitlistEntry[]> {
    const activeEntries = await this.repository.findByStatus(restaurantId, "waiting");
    const eligible = activeEntries.filter((e) => this.eligibilityPolicy.isEligibleForPromotion(e).eligible);
    return this.priorityCalculator.sortByPriority(eligible).slice(0, limit);
  }

  private async markAsEligible(entry: WaitlistEntry): Promise<WaitlistEntry> {
    if (!entry.status.isWaiting()) {
      return entry;
    }

    const updated: WaitlistEntry = {
      ...entry,
      status: WaitlistStatus.create("eligible"),
      updatedAt: new Date(),
    };

    return this.repository.update(updated);
  }
}
