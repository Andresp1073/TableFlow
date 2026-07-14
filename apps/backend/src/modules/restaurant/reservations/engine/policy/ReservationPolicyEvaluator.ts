import type { PartySize } from "../../domain/models/PartySize.js";
import type { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import type { ReservationSource } from "../../domain/models/ReservationSource.js";
import type { PolicyEvaluationResult } from "../types.js";
import { ReservationPolicyValidator } from "../../domain/services/ReservationPolicyValidator.js";

export class ReservationPolicyEvaluator {
  private readonly policyValidator = new ReservationPolicyValidator();

  evaluateForCreation(
    partySize: PartySize,
    timeRange: ReservationTimeRange,
    source: ReservationSource,
  ): PolicyEvaluationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validation = this.policyValidator.validateForCreation(partySize, timeRange, source);
    errors.push(...validation.errors);

    if (partySize.isLargeParty()) {
      warnings.push("Large party requires special handling");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  evaluatePartySize(partySize: PartySize): PolicyEvaluationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.policyValidator.validatePartySize(partySize);
    } catch (e) {
      errors.push((e as Error).message);
    }

    if (partySize.isLargeParty()) {
      warnings.push("Large party requires special handling");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  evaluateTimeRange(timeRange: ReservationTimeRange): PolicyEvaluationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.policyValidator.validateTimeRange(timeRange);
    } catch (e) {
      errors.push((e as Error).message);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  evaluateSource(source: ReservationSource): PolicyEvaluationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!source.isCustomerFacing()) {
      warnings.push("Non-customer-facing source requires staff authentication");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}
