import type { Reward } from "../models/Reward.js";
import type { LoyaltyPolicy } from "../models/LoyaltyPolicy.js";

export class RewardService {
  checkEligibility(
    reward: Reward,
    customerRedemptions: number,
  ): { eligible: boolean; reason: string | null } {
    if (!reward.isCurrentlyAvailable()) {
      return { eligible: false, reason: "Reward is not currently available" };
    }
    if (!reward.canBeRedeemedByCustomer(customerRedemptions)) {
      return { eligible: false, reason: "Maximum redemptions reached for this customer" };
    }
    return { eligible: true, reason: null };
  }

  calculatePointsRequired(
    reward: Reward,
    policy: LoyaltyPolicy,
  ): number {
    const required = reward.costInPoints;
    if (required < policy.minimumRedemptionPoints) {
      return policy.minimumRedemptionPoints;
    }
    return required;
  }

  findAvailableRewards(rewards: Reward[]): Reward[] {
    return rewards.filter((r) => r.isCurrentlyAvailable());
  }

  findRewardsByPointsRange(rewards: Reward[], minPoints: number, maxPoints: number): Reward[] {
    return rewards.filter(
      (r) => r.costInPoints >= minPoints && r.costInPoints <= maxPoints && r.isCurrentlyAvailable(),
    );
  }
}
