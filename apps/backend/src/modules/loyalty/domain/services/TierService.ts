import { CustomerTier } from "../models/CustomerProfile.js";
import type { LoyaltyProgram } from "../models/LoyaltyProgram.js";
import type { PointsAccount } from "../models/PointsAccount.js";
import type { CustomerProfile } from "../models/CustomerProfile.js";
import { LoyaltyLevelChanged } from "../events/LoyaltyLevelChanged.js";

export class TierService {
  evaluateTierChange(
    account: PointsAccount,
    program: LoyaltyProgram,
  ): { newTier: CustomerTier; changed: boolean; event: LoyaltyLevelChanged | null } {
    const tierConfig = program.getTierForPoints(account.lifetimePointsEarned);
    let mappedTier: CustomerTier;

    switch (tierConfig.name.toLowerCase()) {
      case "bronze": mappedTier = CustomerTier.Bronze; break;
      case "silver": mappedTier = CustomerTier.Silver; break;
      case "gold": mappedTier = CustomerTier.Gold; break;
      case "platinum": mappedTier = CustomerTier.Platinum; break;
      default: mappedTier = CustomerTier.Custom; break;
    }

    if (mappedTier === account.currentTier) {
      return { newTier: mappedTier, changed: false, event: null };
    }

    const event = new LoyaltyLevelChanged(
      account.customerProfileId,
      account.restaurantId,
      account.currentTier,
      mappedTier,
      account.lifetimePointsEarned,
    );

    return { newTier: mappedTier, changed: true, event };
  }

  applyTierChange(
    account: PointsAccount,
    profile: CustomerProfile,
    newTier: CustomerTier,
  ): { account: PointsAccount; profile: CustomerProfile } {
    return {
      account: account.updateTier(newTier),
      profile: profile.updateTier(newTier),
    };
  }
}
