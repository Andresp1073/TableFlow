import type { WaitlistEntry } from "./WaitlistEntry.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";

export interface PriorityFactors {
  waitingTimeWeight: number;
  partySizeWeight: number;
  sourceWeight: number;
}

export const DEFAULT_PRIORITY_FACTORS: PriorityFactors = {
  waitingTimeWeight: 0.5,
  partySizeWeight: 0.3,
  sourceWeight: 0.2,
};

export interface PriorityScore {
  score: number;
  breakdown: {
    waitingTime: number;
    partySize: number;
    source: number;
  };
}

export class WaitlistPriorityCalculator {
  private readonly factors: PriorityFactors;

  constructor(factors: Partial<PriorityFactors> = {}) {
    this.factors = { ...DEFAULT_PRIORITY_FACTORS, ...factors };
  }

  calculate(entry: WaitlistEntry): PriorityScore {
    const waitingTime = this.calculateWaitingTimeScore(entry);
    const partySize = this.calculatePartySizeScore(entry);
    const source = this.calculateSourceScore(entry);

    const score = (
      waitingTime * this.factors.waitingTimeWeight +
      partySize * this.factors.partySizeWeight +
      source * this.factors.sourceWeight
    );

    return {
      score: Math.round(score * 100) / 100,
      breakdown: { waitingTime, partySize, source },
    };
  }

  compare(a: WaitlistEntry, b: WaitlistEntry): number {
    const scoreA = this.calculate(a);
    const scoreB = this.calculate(b);
    return scoreB.score - scoreA.score;
  }

  sortByPriority(entries: WaitlistEntry[]): WaitlistEntry[] {
    return [...entries].sort((a, b) => this.compare(a, b));
  }

  private calculateWaitingTimeScore(entry: WaitlistEntry): number {
    const now = new Date();
    const createdAt = entry.createdAt;
    const elapsedMs = now.getTime() - createdAt.getTime();
    const elapsedMinutes = elapsedMs / 60000;

    return Math.min(elapsedMinutes / 120, 1);
  }

  private calculatePartySizeScore(entry: WaitlistEntry): number {
    const { partySize } = entry;

    if (partySize >= 8) return 0.4;
    if (partySize >= 6) return 0.6;
    if (partySize >= 4) return 0.8;
    return 1.0;
  }

  private calculateSourceScore(entry: WaitlistEntry): number {
    const sourceValue = entry.source.value;

    switch (sourceValue) {
      case "walk_in":
        return 1.0;
      case "phone":
        return 0.8;
      case "website":
        return 0.6;
      case "mobile_app":
        return 0.6;
      case "admin_panel":
        return 0.4;
      case "api":
        return 0.3;
      default:
        return 0.5;
    }
  }

  withFactors(factors: Partial<PriorityFactors>): WaitlistPriorityCalculator {
    return new WaitlistPriorityCalculator({ ...this.factors, ...factors });
  }
}
