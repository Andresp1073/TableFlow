import type { PaymentPolicy } from "../models/PaymentPolicy.js";
import { PaymentPolicyType } from "../models/PaymentPolicy.js";
import type { PaymentTransaction } from "../models/PaymentTransaction.js";

export interface RefundEligibilityResult {
  isEligible: boolean;
  reason: string | null;
  requiresApproval: boolean;
  approvalThreshold: number;
}

export class RefundPolicyService {
  checkEligibility(
    transaction: PaymentTransaction,
    refundAmount: number,
    refundPolicies: PaymentPolicy[],
  ): RefundEligibilityResult {
    const applicablePolicies = refundPolicies.filter(
      (p) => p.type === PaymentPolicyType.Refund && p.isEnabled,
    );

    applicablePolicies.sort((a, b) => b.priority - a.priority);

    if (transaction.status !== "captured") {
      return {
        isEligible: false,
        reason: `Transaction is in ${transaction.status} status, must be captured`,
        requiresApproval: false,
        approvalThreshold: 0,
      };
    }

    if (refundAmount <= 0) {
      return {
        isEligible: false,
        reason: "Refund amount must be positive",
        requiresApproval: false,
        approvalThreshold: 0,
      };
    }

    if (refundAmount > transaction.getRemainingRefundableAmount()) {
      return {
        isEligible: false,
        reason: "Refund amount exceeds remaining refundable amount",
        requiresApproval: false,
        approvalThreshold: 0,
      };
    }

    let requiresApproval = false;
    let approvalThreshold = 0;

    for (const policy of applicablePolicies) {
      const threshold = policy.getRule<number>("requireApprovalAbove", 0);
      if (threshold > 0 && refundAmount >= threshold) {
        requiresApproval = true;
        approvalThreshold = threshold;
        break;
      }
    }

    return {
      isEligible: true,
      reason: null,
      requiresApproval,
      approvalThreshold,
    };
  }

  calculateMaxRefundableDays(transaction: PaymentTransaction, policies: PaymentPolicy[]): number {
    const applicablePolicies = policies.filter(
      (p) => p.type === PaymentPolicyType.Refund && p.isEnabled,
    );

    let maxDays = 365;
    for (const policy of applicablePolicies) {
      const days = policy.getRule<number>("maxRefundDays", 365);
      if (days < maxDays) {
        maxDays = days;
      }
    }

    return maxDays;
  }
}
