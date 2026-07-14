import type { ConflictRule, PipelineContext } from "../ConflictRule.js";
import type { ConflictResult } from "../ConflictResult.js";
import { noConflict, blockingConflict, warningConflict } from "../ConflictResult.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { ReservationPolicyEvaluator } from "../../policy/ReservationPolicyEvaluator.js";

export class ReservationPolicyConflictRule implements ConflictRule {
  readonly name = "reservation_policy_conflict";
  private readonly policyEvaluator = new ReservationPolicyEvaluator();

  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    let partySize: PartySize;
    try {
      partySize = PartySize.create(context.partySize);
    } catch {
      return blockingConflict(
        "PARTY_SIZE_POLICY",
        `Party size ${context.partySize} violates reservation policy`,
        { partySize: context.partySize },
      );
    }

    const partyResult = this.policyEvaluator.evaluatePartySize(partySize);
    if (!partyResult.isValid) {
      return blockingConflict(
        "PARTY_SIZE_POLICY",
        `Party size ${context.partySize} violates reservation policy`,
        { partySize: context.partySize, errors: partyResult.errors },
      );
    }

    if (partyResult.warnings.length > 0) {
      return warningConflict(
        "LARGE_PARTY_WARNING",
        `Party size ${context.partySize} requires special handling`,
        { partySize: context.partySize, warnings: partyResult.warnings },
      );
    }

    let timeRange: ReservationTimeRange;
    try {
      timeRange = ReservationTimeRange.create(context.startTime, context.endTime);
    } catch {
      return blockingConflict(
        "TIME_RANGE_POLICY",
        "Reservation time range violates policy",
        { startTime: context.startTime.toISOString(), endTime: context.endTime.toISOString() },
      );
    }

    const timeResult = this.policyEvaluator.evaluateTimeRange(timeRange);
    if (!timeResult.isValid) {
      return blockingConflict(
        "TIME_RANGE_POLICY",
        "Reservation time range violates policy",
        { errors: timeResult.errors },
      );
    }

    return noConflict();
  }
}
