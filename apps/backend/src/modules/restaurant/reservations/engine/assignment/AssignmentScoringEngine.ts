import type { AssignmentCandidate, AssignmentContext, AssignmentScore, ScoringFactors } from "./types.js";

const DEFAULT_FACTORS: ScoringFactors = {
  capacityFitWeight: 0.35,
  availabilityWeight: 0.30,
  diningAreaWeight: 0.15,
  utilizationWeight: 0.20,
};

export class AssignmentScoringEngine {
  private readonly factors: ScoringFactors;

  constructor(factors?: Partial<ScoringFactors>) {
    this.factors = { ...DEFAULT_FACTORS, ...factors };
  }

  score(candidate: AssignmentCandidate, context: AssignmentContext): AssignmentScore {
    const capacityFit = this.calculateCapacityFit(candidate, context);
    const availabilityQuality = this.calculateAvailabilityQuality(candidate);
    const diningAreaFit = this.calculateDiningAreaFit(candidate, context);
    const utilizationScore = this.calculateUtilizationScore(candidate, context);

    const totalScore =
      capacityFit * this.factors.capacityFitWeight +
      availabilityQuality * this.factors.availabilityWeight +
      diningAreaFit * this.factors.diningAreaWeight +
      utilizationScore * this.factors.utilizationWeight;

    return {
      candidate,
      totalScore: Math.round(totalScore * 100) / 100,
      capacityFit,
      availabilityQuality,
      diningAreaFit,
      utilizationScore,
    };
  }

  withFactors(factors: Partial<ScoringFactors>): AssignmentScoringEngine {
    return new AssignmentScoringEngine({ ...this.factors, ...factors });
  }

  getFactors(): ScoringFactors {
    return { ...this.factors };
  }

  private calculateCapacityFit(candidate: AssignmentCandidate, context: AssignmentContext): number {
    if (context.partySize > candidate.maximumCapacity) return 0;
    if (context.partySize < candidate.minimumCapacity) return 0;

    const wastedCapacity = candidate.maximumCapacity - context.partySize;
    const capacityRange = candidate.maximumCapacity - candidate.minimumCapacity;

    if (capacityRange === 0) return 1.0;

    return Math.round((1.0 - wastedCapacity / capacityRange) * 100) / 100;
  }

  private calculateAvailabilityQuality(candidate: AssignmentCandidate): number {
    if (candidate.isAvailable) return 1.0;
    if (candidate.isTableGroup) return 0.3;
    return 0.0;
  }

  private calculateDiningAreaFit(candidate: AssignmentCandidate, context: AssignmentContext): number {
    if (!context.preferredDiningAreaId) return 0.5;
    if (candidate.diningAreaId === context.preferredDiningAreaId) return 1.0;
    return 0.0;
  }

  private calculateUtilizationScore(candidate: AssignmentCandidate, context: AssignmentContext): number {
    if (candidate.maximumCapacity === 0) return 0;

    const utilizationRatio = context.partySize / candidate.maximumCapacity;

    if (utilizationRatio >= 1.0) return 1.0;
    if (utilizationRatio >= 0.7) return Math.round(utilizationRatio * 100) / 100;
    if (utilizationRatio >= 0.5) return 0.6;
    if (utilizationRatio >= 0.3) return 0.3;
    return 0.1;
  }
}
