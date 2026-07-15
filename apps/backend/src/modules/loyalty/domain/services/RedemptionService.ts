import { RewardRedemption, RedemptionStatus } from "../models/RewardRedemption.js";
import type { PointsAccount } from "../models/PointsAccount.js";
import type { Reward } from "../models/Reward.js";
import type { LoyaltyPolicy } from "../models/LoyaltyPolicy.js";
import { RewardService } from "./RewardService.js";

export class RedemptionService {
  constructor(private readonly rewardService: RewardService) {}

  requestRedemption(
    account: PointsAccount,
    reward: Reward,
    policy: LoyaltyPolicy,
    customerProfileId: string,
    restaurantId: string,
    customerRedemptions: number,
    dailyRedemptions: number,
    referenceId: string,
  ): { redemption: RewardRedemption; canProceed: boolean } {
    const eligibility = this.rewardService.checkEligibility(reward, customerRedemptions);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason!);
    }

    const validationError = policy.validateRedemption(reward.costInPoints, dailyRedemptions);
    if (validationError) {
      throw new Error(validationError);
    }

    if (account.currentBalance < reward.costInPoints) {
      throw new Error("Insufficient points balance");
    }

    const requiresValidation = policy.redemptionRequiresValidation;
    const requiresApproval = policy.redemptionRequiresApproval;

    let redemption = RewardRedemption.create({
      id: crypto.randomUUID(),
      rewardId: reward.id,
      rewardName: reward.name,
      accountId: account.id,
      customerProfileId,
      restaurantId,
      pointsCost: reward.costInPoints,
      referenceId,
      referenceType: "redemption_request",
    });

    let canProceed = true;

    if (!requiresValidation && !requiresApproval) {
      redemption = redemption.validate();
      redemption = redemption.approve("system");
      redemption = redemption.complete();
    } else if (!requiresValidation) {
      redemption = redemption.validate();
      canProceed = false;
    } else {
      canProceed = false;
    }

    return { redemption, canProceed };
  }

  validateRedemption(redemption: RewardRedemption): RewardRedemption {
    if (redemption.status !== RedemptionStatus.Requested) {
      throw new Error(`Cannot validate redemption in status: ${redemption.status}`);
    }
    return redemption.validate();
  }

  approveRedemption(redemption: RewardRedemption, approvedBy: string): RewardRedemption {
    if (redemption.status !== RedemptionStatus.Validated) {
      throw new Error(`Cannot approve redemption in status: ${redemption.status}`);
    }
    return redemption.approve(approvedBy);
  }

  completeRedemption(redemption: RewardRedemption): RewardRedemption {
    if (redemption.status !== RedemptionStatus.Approved) {
      throw new Error(`Cannot complete redemption in status: ${redemption.status}`);
    }
    return redemption.complete();
  }

  cancelRedemption(redemption: RewardRedemption, reason: string): RewardRedemption {
    if (redemption.status === RedemptionStatus.Completed || redemption.status === RedemptionStatus.Cancelled) {
      throw new Error(`Cannot cancel redemption in status: ${redemption.status}`);
    }
    return redemption.cancel(reason);
  }
}
