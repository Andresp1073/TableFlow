import { describe, it, expect } from "vitest";
import { RewardRedemption, RedemptionStatus } from "../domain/models/RewardRedemption.js";
import { RedemptionService } from "../domain/services/RedemptionService.js";
import { RewardService } from "../domain/services/RewardService.js";
import { Reward, RewardType } from "../domain/models/Reward.js";
import { PointsAccount } from "../domain/models/PointsAccount.js";
import { CustomerTier } from "../domain/models/CustomerProfile.js";
import { LoyaltyPolicy } from "../domain/models/LoyaltyPolicy.js";

function makeRedemption(overrides?: Record<string, unknown>): RewardRedemption {
  return RewardRedemption.reconstitute({
    id: "red-1", rewardId: "rew-1", rewardName: "Free Coffee",
    accountId: "acc-1", customerProfileId: "cp-1", restaurantId: "rest-1",
    status: RedemptionStatus.Requested, pointsCost: 200,
    referenceId: "ref-1", referenceType: "order",
    requestedAt: new Date(), validatedAt: null,
    approvedBy: null, approvedAt: null,
    completedAt: null, cancelledAt: null,
    cancellationReason: null, notes: "",
    ...overrides,
  });
}

function makeAccount(balance: number = 1000): PointsAccount {
  return PointsAccount.reconstitute({
    id: "acc-1", customerProfileId: "cp-1", programId: "prog-1",
    restaurantId: "rest-1", currentBalance: balance,
    lifetimePointsEarned: balance, lifetimePointsRedeemed: 0,
    currentTier: CustomerTier.Bronze, enrolledAt: new Date(),
    lastActivityAt: new Date(), isActive: true,
  });
}

function makeReward(): Reward {
  return Reward.reconstitute({
    id: "rew-1", programId: "prog-1", restaurantId: "rest-1",
    name: "Free Coffee", description: "A free coffee",
    type: RewardType.FreeProduct, costInPoints: 200,
    value: 5, valueCurrency: "USD",
    termsConditions: "Valid once",
    isActive: true, validFrom: new Date("2024-01-01"), validTo: null,
    maxRedemptionsPerCustomer: 5, totalQuantity: 100, remainingQuantity: 100,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function makePolicy(overrides?: Record<string, unknown>): LoyaltyPolicy {
  return LoyaltyPolicy.reconstitute({
    id: "pol-1", restaurantId: "rest-1", name: "Default",
    description: "Default", pointsExpirationDays: null,
    minimumRedemptionPoints: 100, maximumPointsPerTransaction: null,
    enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
    pointsRounding: "round", allowNegativeBalance: false,
    redemptionRequiresValidation: false, redemptionRequiresApproval: false,
    maximumRedemptionsPerDay: 10, daysUntilTierDowngrade: null,
    daysUntilTierUpgrade: null, isActive: true,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

describe("RewardRedemption", () => {
  it("creates in requested status", () => {
    const r = makeRedemption();
    expect(r.status).toBe(RedemptionStatus.Requested);
  });

  it("transitions through lifecycle", () => {
    const r = makeRedemption();
    const validated = r.validate();
    expect(validated.status).toBe(RedemptionStatus.Validated);
    const approved = validated.approve("manager-1");
    expect(approved.status).toBe(RedemptionStatus.Approved);
    expect(approved.approvedBy).toBe("manager-1");
    const completed = approved.complete();
    expect(completed.status).toBe(RedemptionStatus.Completed);
  });

  it("cancels from any non-terminal state", () => {
    const r = makeRedemption();
    const cancelled = r.cancel("Customer changed mind");
    expect(cancelled.status).toBe(RedemptionStatus.Cancelled);
    expect(cancelled.cancellationReason).toBe("Customer changed mind");
  });

  it("rejects invalid transitions", () => {
    const r = makeRedemption({ status: RedemptionStatus.Completed });
    expect(() => r.approve("mgr")).toThrow("Cannot transition");
  });
});

describe("RedemptionService", () => {
  const rewardService = new RewardService();
  const service = new RedemptionService(rewardService);

  it("auto-completes when no validation required", () => {
    const account = makeAccount(500);
    const reward = makeReward();
    const policy = makePolicy();
    const result = service.requestRedemption(account, reward, policy, "cp-1", "rest-1", 0, 0, "ref-1");
    expect(result.redemption.status).toBe(RedemptionStatus.Completed);
    expect(result.canProceed).toBe(true);
  });

  it("requires approval when configured", () => {
    const account = makeAccount(500);
    const reward = makeReward();
    const policy = makePolicy({ redemptionRequiresValidation: true, redemptionRequiresApproval: true });
    const result = service.requestRedemption(account, reward, policy, "cp-1", "rest-1", 0, 0, "ref-1");
    expect(result.redemption.status).toBe(RedemptionStatus.Requested);
    expect(result.canProceed).toBe(false);
  });

  it("throws on insufficient balance", () => {
    const account = makeAccount(50);
    const reward = makeReward();
    const policy = makePolicy();
    expect(() => service.requestRedemption(account, reward, policy, "cp-1", "rest-1", 0, 0, "ref-1"))
      .toThrow("Insufficient points balance");
  });

  it("throws on maximum redemptions per day", () => {
    const account = makeAccount(500);
    const reward = makeReward();
    const policy = makePolicy({ maximumRedemptionsPerDay: 5 });
    expect(() => service.requestRedemption(account, reward, policy, "cp-1", "rest-1", 0, 5, "ref-1"))
      .toThrow("Maximum daily redemptions");
  });

  it("validates, approves, and completes redemption", () => {
    const r = makeRedemption();
    const validated = service.validateRedemption(r);
    expect(validated.status).toBe(RedemptionStatus.Validated);
    const approved = service.approveRedemption(validated, "mgr-1");
    expect(approved.status).toBe(RedemptionStatus.Approved);
    const completed = service.completeRedemption(approved);
    expect(completed.status).toBe(RedemptionStatus.Completed);
  });

  it("cancels redemption", () => {
    const r = makeRedemption();
    const cancelled = service.cancelRedemption(r, "No longer needed");
    expect(cancelled.status).toBe(RedemptionStatus.Cancelled);
  });
});
