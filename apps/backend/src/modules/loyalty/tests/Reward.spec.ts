import { describe, it, expect } from "vitest";
import { Reward, RewardType } from "../domain/models/Reward.js";
import { RewardService } from "../domain/services/RewardService.js";
import { LoyaltyPolicy } from "../domain/models/LoyaltyPolicy.js";

function makeReward(overrides?: Record<string, unknown>): Reward {
  return Reward.reconstitute({
    id: "rew-1", programId: "prog-1", restaurantId: "rest-1",
    name: "Free Coffee", description: "A free coffee",
    type: RewardType.FreeProduct, costInPoints: 200,
    value: 5, valueCurrency: "USD",
    termsConditions: "Valid for one coffee",
    isActive: true,
    validFrom: new Date("2024-01-01"), validTo: null,
    maxRedemptionsPerCustomer: 5, totalQuantity: 100, remainingQuantity: 100,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

function makePolicy(): LoyaltyPolicy {
  return LoyaltyPolicy.reconstitute({
    id: "pol-1", restaurantId: "rest-1", name: "Default",
    description: "Default", pointsExpirationDays: null,
    minimumRedemptionPoints: 100, maximumPointsPerTransaction: null,
    enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
    pointsRounding: "round", allowNegativeBalance: false,
    redemptionRequiresValidation: false, redemptionRequiresApproval: false,
    maximumRedemptionsPerDay: null, daysUntilTierDowngrade: null,
    daysUntilTierUpgrade: null, isActive: true,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

describe("Reward", () => {
  it("creates a reward", () => {
    const r = makeReward();
    expect(r.name).toBe("Free Coffee");
    expect(r.type).toBe(RewardType.FreeProduct);
    expect(r.isCurrentlyAvailable()).toBe(true);
  });

  it("checks availability with date range", () => {
    const future = makeReward({ validFrom: new Date("2099-01-01") });
    expect(future.isCurrentlyAvailable()).toBe(false);
  });

  it("checks availability with quantity limit", () => {
    const depleted = makeReward({ remainingQuantity: 0 });
    expect(depleted.isCurrentlyAvailable()).toBe(false);
  });

  it("checks max redemptions per customer", () => {
    const r = makeReward();
    expect(r.canBeRedeemedByCustomer(3)).toBe(true);
    expect(r.canBeRedeemedByCustomer(5)).toBe(false);
  });

  it("decrements quantity on redeem", () => {
    const r = makeReward();
    const redeemed = r.redeem();
    expect(redeemed.remainingQuantity).toBe(99);
  });

  it("throws when redeeming with no quantity", () => {
    const r = makeReward({ remainingQuantity: 0 });
    expect(() => r.redeem()).toThrow("No remaining quantity");
  });

  it("activates and deactivates", () => {
    const r = makeReward();
    expect(r.deactivate().isActive).toBe(false);
    expect(r.activate().isActive).toBe(true);
  });
});

describe("RewardService", () => {
  const service = new RewardService();
  const policy = makePolicy();

  it("checks eligibility", () => {
    const r = makeReward();
    const result = service.checkEligibility(r, 0);
    expect(result.eligible).toBe(true);
  });

  it("rejects ineligible rewards", () => {
    const r = makeReward({ remainingQuantity: 0 });
    const result = service.checkEligibility(r, 0);
    expect(result.eligible).toBe(false);
  });

  it("calculates points required", () => {
    const r = makeReward();
    const required = service.calculatePointsRequired(r, policy);
    expect(required).toBe(200);
  });

  it("enforces minimum redemption", () => {
    const minPolicy = LoyaltyPolicy.reconstitute({ ...policy.value, minimumRedemptionPoints: 500 });
    const r = makeReward();
    const required = service.calculatePointsRequired(r, minPolicy);
    expect(required).toBe(500);
  });

  it("filters available rewards", () => {
    const r1 = makeReward();
    const r2 = makeReward({ remainingQuantity: 0 });
    const available = service.findAvailableRewards([r1, r2]);
    expect(available).toHaveLength(1);
  });

  it("filters by points range", () => {
    const r1 = makeReward({ costInPoints: 100 });
    const r2 = makeReward({ costInPoints: 500 });
    const filtered = service.findRewardsByPointsRange([r1, r2], 150, 600);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].costInPoints).toBe(500);
  });
});
