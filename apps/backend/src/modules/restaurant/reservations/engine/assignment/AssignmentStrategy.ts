import type { AssignmentCandidate, AssignmentContext } from "./types.js";
import type { AssignmentResult } from "./AssignmentResult.js";
import { notAssigned, assigned, assignedGroup } from "./AssignmentResult.js";
import type { AssignmentScoringEngine } from "./AssignmentScoringEngine.js";

export interface AssignmentStrategy {
  readonly name: string;
  select(candidates: AssignmentCandidate[], context: AssignmentContext): AssignmentResult;
}

export class DefaultAssignmentStrategy implements AssignmentStrategy {
  readonly name = "default";

  constructor(private readonly scoringEngine: AssignmentScoringEngine) {}

  select(candidates: AssignmentCandidate[], context: AssignmentContext): AssignmentResult {
    if (candidates.length === 0) {
      return notAssigned("No available candidates found");
    }

    const scores = candidates.map((c) => this.scoringEngine.score(c, context));

    const sorted = [...scores].sort((a, b) => {
      const diff = b.totalScore - a.totalScore;
      if (diff !== 0) return diff;

      return b.capacityFit - a.capacityFit;
    });

    const bestScore = sorted[0];
    if (!bestScore || bestScore.totalScore <= 0) {
      return notAssigned("No suitable candidate found", {
        strategy: this.name,
        candidatesEvaluated: candidates.length,
      });
    }

    const result = bestScore.candidate.isTableGroup
      ? assignedGroup(bestScore.candidate.tableGroupId!, bestScore.totalScore)
      : assigned(bestScore.candidate.tableId, bestScore.totalScore);

    result.metadata = {
      strategy: this.name,
      totalScore: bestScore.totalScore,
      capacityFit: bestScore.capacityFit,
      availabilityQuality: bestScore.availabilityQuality,
      diningAreaFit: bestScore.diningAreaFit,
      utilizationScore: bestScore.utilizationScore,
      isTableGroup: bestScore.candidate.isTableGroup,
      isAvailable: bestScore.candidate.isAvailable,
      candidatesEvaluated: candidates.length,
    };

    return result;
  }
}

export class BestFitAssignmentStrategy implements AssignmentStrategy {
  readonly name = "best_fit";

  constructor(private readonly scoringEngine: AssignmentScoringEngine) {}

  select(candidates: AssignmentCandidate[], context: AssignmentContext): AssignmentResult {
    if (candidates.length === 0) {
      return notAssigned("No available candidates found");
    }

    const available = candidates.filter((c) => c.isAvailable);

    if (available.length === 0) {
      return notAssigned("No available tables found for the requested time", {
        strategy: this.name,
        candidatesEvaluated: candidates.length,
      });
    }

    const scored = available.map((c) => ({
      ...c,
      wastedCapacity: c.maximumCapacity - context.partySize,
    }));

    scored.sort((a, b) => {
      const diff = a.wastedCapacity - b.wastedCapacity;
      if (diff !== 0) return diff;

      return b.maximumCapacity - a.maximumCapacity;
    });

    const best = scored[0];
    if (!best) {
      return notAssigned("No suitable candidate found", {
        strategy: this.name,
      });
    }

    const scoreResult = this.scoringEngine.score(best, context);
    const result = best.isTableGroup
      ? assignedGroup(best.tableGroupId!, scoreResult.totalScore)
      : assigned(best.tableId, scoreResult.totalScore);

    result.metadata = {
      strategy: this.name,
      totalScore: scoreResult.totalScore,
      wastedCapacity: best.wastedCapacity,
      isAvailable: best.isAvailable,
      isTableGroup: best.isTableGroup,
      candidatesEvaluated: candidates.length,
    };

    return result;
  }
}
