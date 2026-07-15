import { PointsTransaction, PointsTransactionType } from "../models/PointsTransaction.js";
import type { PointsAccount } from "../models/PointsAccount.js";
import type { LoyaltyProgram } from "../models/LoyaltyProgram.js";
import type { LoyaltyPolicy } from "../models/LoyaltyPolicy.js";
import { CustomerTier } from "../models/CustomerProfile.js";

export class PointsEngine {
  earnPoints(
    account: PointsAccount,
    program: LoyaltyProgram,
    policy: LoyaltyPolicy,
    spentAmount: number,
    tierMultiplier: number,
    referenceId: string,
    referenceType: string,
    performedBy: string,
  ): { account: PointsAccount; transaction: PointsTransaction } {
    const rawPoints = program.calculatePoints(spentAmount, tierMultiplier);
    let points: number;
    switch (policy.pointsRounding) {
      case "ceil": points = Math.ceil(rawPoints); break;
      case "floor": points = Math.floor(rawPoints); break;
      default: points = Math.round(rawPoints);
    }

    if (policy.maximumPointsPerTransaction !== null) {
      points = Math.min(points, policy.maximumPointsPerTransaction);
    }

    const balanceBefore = account.currentBalance;
    const updatedAccount = account.credit(points);
    const expiresAt = policy.calculateExpirationDate(new Date());

    const transaction = PointsTransaction.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      type: PointsTransactionType.Earn,
      points,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      referenceId,
      referenceType,
      description: `Earned ${points} points for ${referenceType} ${referenceId}`,
      expiresAt,
      performedBy,
    });

    return { account: updatedAccount, transaction };
  }

  redeemPoints(
    account: PointsAccount,
    points: number,
    referenceId: string,
    referenceType: string,
    performedBy: string,
  ): { account: PointsAccount; transaction: PointsTransaction } {
    const balanceBefore = account.currentBalance;
    const updatedAccount = account.debit(points);

    const transaction = PointsTransaction.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      type: PointsTransactionType.Redeem,
      points: -points,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      referenceId,
      referenceType,
      description: `Redeemed ${points} points for ${referenceType} ${referenceId}`,
      expiresAt: null,
      performedBy,
    });

    return { account: updatedAccount, transaction };
  }

  awardBonus(
    account: PointsAccount,
    points: number,
    reason: string,
    referenceId: string,
    performedBy: string,
  ): { account: PointsAccount; transaction: PointsTransaction } {
    const balanceBefore = account.currentBalance;
    const updatedAccount = account.credit(points);

    const transaction = PointsTransaction.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      type: PointsTransactionType.Bonus,
      points,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      referenceId,
      referenceType: "bonus",
      description: `Bonus: ${reason}`,
      expiresAt: null,
      performedBy,
    });

    return { account: updatedAccount, transaction };
  }

  adjustPoints(
    account: PointsAccount,
    points: number,
    reason: string,
    performedBy: string,
  ): { account: PointsAccount; transaction: PointsTransaction } {
    const balanceBefore = account.currentBalance;
    const updatedAccount = account.adjust(points);

    const transaction = PointsTransaction.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      type: PointsTransactionType.Adjustment,
      points,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      referenceId: account.id,
      referenceType: "adjustment",
      description: `Adjustment: ${reason}`,
      expiresAt: null,
      performedBy,
    });

    return { account: updatedAccount, transaction };
  }

  expirePoints(
    account: PointsAccount,
    points: number,
    performedBy: string,
  ): { account: PointsAccount; transaction: PointsTransaction } {
    const balanceBefore = account.currentBalance;
    const updatedAccount = account.debit(points);

    const transaction = PointsTransaction.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      type: PointsTransactionType.Expiration,
      points: -points,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      referenceId: account.id,
      referenceType: "expiration",
      description: `Expired ${points} points`,
      expiresAt: null,
      performedBy,
    });

    return { account: updatedAccount, transaction };
  }

  reverseTransaction(
    account: PointsAccount,
    originalTransaction: PointsTransaction,
    performedBy: string,
  ): { account: PointsAccount; transaction: PointsTransaction } {
    if (!originalTransaction.canReverse()) {
      throw new Error(`Transaction type ${originalTransaction.type} cannot be reversed`);
    }

    const reversalPoints = originalTransaction.isCredit()
      ? -originalTransaction.points
      : Math.abs(originalTransaction.points);

    const balanceBefore = account.currentBalance;
    const updatedAccount = account.adjust(reversalPoints);

    const transaction = PointsTransaction.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      type: PointsTransactionType.Refund,
      points: reversalPoints,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      referenceId: originalTransaction.id,
      referenceType: "reversal",
      description: `Reversal of ${originalTransaction.type}: ${originalTransaction.description}`,
      expiresAt: null,
      performedBy,
    });

    return { account: updatedAccount, transaction };
  }

  determineTier(program: LoyaltyProgram, lifetimePoints: number): CustomerTier {
    const tier = program.getTierForPoints(lifetimePoints);
    switch (tier.name.toLowerCase()) {
      case "bronze": return CustomerTier.Bronze;
      case "silver": return CustomerTier.Silver;
      case "gold": return CustomerTier.Gold;
      case "platinum": return CustomerTier.Platinum;
      default: return CustomerTier.Custom;
    }
  }
}
