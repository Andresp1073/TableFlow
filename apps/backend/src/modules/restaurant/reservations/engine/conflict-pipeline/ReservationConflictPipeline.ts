import type { ConflictRule, PipelineContext } from "./ConflictRule.js";
import type { ConflictResult, ConflictSeverity } from "./ConflictResult.js";
import { noConflict } from "./ConflictResult.js";

export interface PipelineResult {
  hasConflict: boolean;
  severity: ConflictSeverity;
  results: ConflictResult[];
  conflictingReservationIds: string[];
  primaryReason: string | null;
  primaryCode: string | null;
}

export class ReservationConflictPipeline {
  constructor(private readonly rules: readonly ConflictRule[]) {}

  async evaluate(context: PipelineContext): Promise<PipelineResult> {
    const results: ConflictResult[] = [];
    const conflictingReservationIds: string[] = [];

    for (const rule of this.rules) {
      const result = await rule.evaluate(context);

      const enriched = {
        ...result,
        metadata: {
          ...result.metadata,
          rule: rule.name,
        },
      };

      results.push(enriched);

      if (result.isConflict && result.metadata?.conflictingIds) {
        const ids = result.metadata.conflictingIds as string[];
        conflictingReservationIds.push(...ids);
      }

      if (result.isConflict && result.severity === "blocking") {
        return {
          hasConflict: true,
          severity: "blocking",
          results,
          conflictingReservationIds: [...new Set(conflictingReservationIds)],
          primaryReason: result.reason,
          primaryCode: result.code,
        };
      }
    }

    const worstResult = results
      .filter((r) => r.isConflict)
      .sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity))[0];

    if (worstResult) {
      return {
        hasConflict: true,
        severity: worstResult.severity,
        results,
        conflictingReservationIds: [...new Set(conflictingReservationIds)],
        primaryReason: worstResult.reason,
        primaryCode: worstResult.code,
      };
    }

    return {
      hasConflict: false,
      severity: "info",
      results,
      conflictingReservationIds: [],
      primaryReason: null,
      primaryCode: null,
    };
  }

  async evaluateAll(context: PipelineContext): Promise<PipelineResult> {
    const results: ConflictResult[] = [];
    const conflictingReservationIds: string[] = [];

    for (const rule of this.rules) {
      const result = await rule.evaluate(context);

      const enriched = {
        ...result,
        metadata: {
          ...result.metadata,
          rule: rule.name,
        },
      };

      results.push(enriched);

      if (result.isConflict && result.metadata?.conflictingIds) {
        const ids = result.metadata.conflictingIds as string[];
        conflictingReservationIds.push(...ids);
      }
    }

    const worstResult = results
      .filter((r) => r.isConflict)
      .sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity))[0];

    if (worstResult) {
      return {
        hasConflict: true,
        severity: worstResult.severity,
        results,
        conflictingReservationIds: [...new Set(conflictingReservationIds)],
        primaryReason: worstResult.reason,
        primaryCode: worstResult.code,
      };
    }

    return {
      hasConflict: false,
      severity: "info",
      results,
      conflictingReservationIds: [],
      primaryReason: null,
      primaryCode: null,
    };
  }

  private severityWeight(severity: ConflictSeverity): number {
    switch (severity) {
      case "blocking": return 3;
      case "warning": return 2;
      case "info": return 1;
    }
  }
}
