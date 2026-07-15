import { describe, it, expect } from "vitest";
import { PointsEngine } from "../domain/services/PointsEngine.js";
import { PointsAccount } from "../domain/models/PointsAccount.js";
import { PointsTransactionType } from "../domain/models/PointsTransaction.js";
import { CustomerTier } from "../domain/models/CustomerProfile.js";
import { LoyaltyProgram } from "../domain/models/LoyaltyProgram.js";
import { LoyaltyPolicy } from "../domain/models/LoyaltyPolicy.js";

function makeAccount(overrides?: Record<string, unknown>): PointsAccount {
  return PointsAccount.reconstitute({
    id: "acc-1", customerProfileId: "cp-1", programId: "prog-1",
    restaurantId: "rest-1", currentBalance: 1000,
    lifetimePointsEarned: 2000, lifetimePointsRedeemed: 1000,
    currentTier: CustomerTier.Silver, enrolledAt: new Date(),
    lastActivityAt: new Date(), isActive: true,
    ...overrides,
  } as any);
}

function makeProgram(): LoyaltyProgram {
  return LoyaltyProgram.reconstitute({
    id: "prog-1", restaurantId: "rest-1", name: "Test Program",
    description: "Test", pointsPerCurrencyUnit: 10, currencyUnit: "USD",
    tiers: [
      { name: "Bronze", minimumLifetimePoints: 0, pointsMultiplier: 1, benefits: [] },
      { name: "Silver", minimumLifetimePoints: 1000, pointsMultiplier: 1.5, benefits: [] },
      { name: "Gold", minimumLifetimePoints: 5000, pointsMultiplier: 2, benefits: [] },
    ],
    rules: [], enrollmentBonusPoints: 100, birthdayBonusPoints: 50,
    pointsExpirationDays: 365, minimumRedemptionPoints: 100,
    isActive: true, startAt: new Date("2024-01-01"), endAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function makePolicy(): LoyaltyPolicy {
  return LoyaltyPolicy.reconstitute({
    id: "pol-1", restaurantId: "rest-1", name: "Default Policy",
    description: "Default", pointsExpirationDays: 365,
    minimumRedemptionPoints: 100, maximumPointsPerTransaction: 5000,
    enrollmentBonusPoints: 100, birthdayBonusPoints: 50,
    pointsRounding: "round", allowNegativeBalance: false,
    redemptionRequiresValidation: false, redemptionRequiresApproval: false,
    maximumRedemptionsPerDay: 10, daysUntilTierDowngrade: null,
    daysUntilTierUpgrade: null, isActive: true,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

describe("PointsEngine", () => {
  const engine = new PointsEngine();
  const program = makeProgram();
  const policy = makePolicy();

  it("earns points based on spend and tier multiplier", () => {
    const account = makeAccount({ currentTier: CustomerTier.Silver });
    const result = engine.earnPoints(account, program, policy, 50, 1.5, "ref-1", "sale", "system");
    expect(result.transaction.type).toBe(PointsTransactionType.Earn);
    expect(result.transaction.points).toBe(750);
    expect(result.account.currentBalance).toBe(1750);
  });

  it("applies maximum points per transaction cap", () => {
    const cappedPolicy = makePolicy();
    cappedPolicy.value.maximumPointsPerTransaction = 500;
    const account = makeAccount();
    const result = engine.earnPoints(account, program, cappedPolicy, 100, 2, "ref-2", "sale", "system");
    expect(result.transaction.points).toBe(500);
  });

  it("respects rounding mode", () => {
    const floorPolicy = LoyaltyPolicy.reconstitute({ ...makePolicy().value, pointsRounding: "floor" });
    const account = makeAccount();
    const result = engine.earnPoints(account, program, floorPolicy, 0.33, 1, "ref-3", "sale", "system");
    expect(result.transaction.points).toBe(3);
  });

  it("redeems points", () => {
    const account = makeAccount({ currentBalance: 500 });
    const result = engine.redeemPoints(account, 200, "ref-4", "reward", "customer");
    expect(result.transaction.type).toBe(PointsTransactionType.Redeem);
    expect(result.transaction.points).toBe(-200);
    expect(result.account.currentBalance).toBe(300);
  });

  it("rejects redemption with insufficient balance", () => {
    const account = makeAccount({ currentBalance: 50 });
    expect(() => engine.redeemPoints(account, 200, "ref-5", "reward", "customer")).toThrow("Insufficient points balance");
  });

  it("awards bonus points", () => {
    const account = makeAccount();
    const result = engine.awardBonus(account, 500, "Birthday bonus", "cp-1", "system");
    expect(result.transaction.type).toBe(PointsTransactionType.Bonus);
    expect(result.account.currentBalance).toBe(1500);
  });

  it("adjusts points (positive and negative)", () => {
    const account = makeAccount({ currentBalance: 1000 });
    const pos = engine.adjustPoints(account, 200, "Correction", "admin");
    expect(pos.account.currentBalance).toBe(1200);
    const neg = engine.adjustPoints(account, -300, "Correction", "admin");
    expect(neg.account.currentBalance).toBe(700);
  });

  it("rejects adjustment below zero", () => {
    const account = makeAccount({ currentBalance: 100 });
    expect(() => engine.adjustPoints(account, -200, "Bad", "admin")).toThrow("would result in negative");
  });

  it("expires points", () => {
    const account = makeAccount({ currentBalance: 1000 });
    const result = engine.expirePoints(account, 300, "system");
    expect(result.transaction.type).toBe(PointsTransactionType.Expiration);
    expect(result.account.currentBalance).toBe(700);
  });

  it("reverses an earn transaction", () => {
    const account = makeAccount({ currentBalance: 1000 });
    const earn = engine.earnPoints(account, program, policy, 50, 1, "ref-r1", "sale", "system");
    const reversal = engine.reverseTransaction(earn.account, earn.transaction, "admin");
    expect(reversal.transaction.type).toBe(PointsTransactionType.Refund);
    expect(reversal.account.currentBalance).toBe(earn.account.currentBalance - earn.transaction.points);
  });

  it("reverses a redeem transaction (restores points)", () => {
    const account = makeAccount({ currentBalance: 500 });
    const redeem = engine.redeemPoints(account, 200, "ref-r2", "reward", "customer");
    const reversal = engine.reverseTransaction(redeem.account, redeem.transaction, "admin");
    expect(reversal.account.currentBalance).toBe(500);
  });

  it("determines tier from lifetime points", () => {
    const tier1 = engine.determineTier(program, 0);
    expect(tier1).toBe(CustomerTier.Bronze);
    const tier2 = engine.determineTier(program, 1000);
    expect(tier2).toBe(CustomerTier.Silver);
    const tier3 = engine.determineTier(program, 5000);
    expect(tier3).toBe(CustomerTier.Gold);
  });
});
