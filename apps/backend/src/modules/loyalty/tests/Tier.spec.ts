import { describe, it, expect } from "vitest";
import { TierService } from "../domain/services/TierService.js";
import { PointsAccount } from "../domain/models/PointsAccount.js";
import { CustomerProfile, CustomerTier } from "../domain/models/CustomerProfile.js";
import { LoyaltyProgram } from "../domain/models/LoyaltyProgram.js";

function makeProgram(): LoyaltyProgram {
  return LoyaltyProgram.reconstitute({
    id: "prog-1", restaurantId: "rest-1", name: "Tier Test",
    description: "Test", pointsPerCurrencyUnit: 10, currencyUnit: "USD",
    tiers: [
      { name: "Bronze", minimumLifetimePoints: 0, pointsMultiplier: 1, benefits: ["Welcome drink"] },
      { name: "Silver", minimumLifetimePoints: 1000, pointsMultiplier: 1.5, benefits: ["Priority seating"] },
      { name: "Gold", minimumLifetimePoints: 5000, pointsMultiplier: 2, benefits: ["Free dessert"] },
      { name: "Platinum", minimumLifetimePoints: 10000, pointsMultiplier: 3, benefits: ["VIP access"] },
    ],
    rules: [], enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
    pointsExpirationDays: null, minimumRedemptionPoints: 100,
    isActive: true, startAt: new Date("2024-01-01"), endAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function makeAccount(tier: CustomerTier, lifetimePoints: number): PointsAccount {
  return PointsAccount.reconstitute({
    id: "acc-1", customerProfileId: "cp-1", programId: "prog-1",
    restaurantId: "rest-1", currentBalance: lifetimePoints,
    lifetimePointsEarned: lifetimePoints, lifetimePointsRedeemed: 0,
    currentTier: tier, enrolledAt: new Date(),
    lastActivityAt: new Date(), isActive: true,
  });
}

function makeProfile(tier: CustomerTier): CustomerProfile {
  return CustomerProfile.reconstitute({
    id: "cp-1", restaurantId: "rest-1", customerId: "cust-1",
    firstName: "Test", lastName: "User", email: "test@example.com",
    tier, totalSpent: 0, totalVisits: 0, firstVisitAt: null,
    lastVisitAt: null, preferences: { marketingOptIn: true },
    tags: [], notes: "", isActive: true, enrolledAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("TierService", () => {
  const service = new TierService();
  const program = makeProgram();

  it("detects upgrade from Bronze to Silver", () => {
    const account = makeAccount(CustomerTier.Bronze, 1500);
    const result = service.evaluateTierChange(account, program);
    expect(result.changed).toBe(true);
    expect(result.newTier).toBe(CustomerTier.Silver);
    expect(result.event).not.toBeNull();
    expect(result.event!.previousTier).toBe(CustomerTier.Bronze);
    expect(result.event!.newTier).toBe(CustomerTier.Silver);
  });

  it("detects upgrade to Platinum", () => {
    const account = makeAccount(CustomerTier.Gold, 15000);
    const result = service.evaluateTierChange(account, program);
    expect(result.changed).toBe(true);
    expect(result.newTier).toBe(CustomerTier.Platinum);
  });

  it("returns no change when tier is the same", () => {
    const account = makeAccount(CustomerTier.Gold, 7500);
    const result = service.evaluateTierChange(account, program);
    expect(result.changed).toBe(false);
    expect(result.event).toBeNull();
  });

  it("applies tier change to both account and profile", () => {
    const account = makeAccount(CustomerTier.Bronze, 1500);
    const profile = makeProfile(CustomerTier.Bronze);
    const result = service.applyTierChange(account, profile, CustomerTier.Silver);
    expect(result.account.currentTier).toBe(CustomerTier.Silver);
    expect(result.profile.tier).toBe(CustomerTier.Silver);
  });

  it("evaluates tier based on lifetime points, not current balance", () => {
    const account = makeAccount(CustomerTier.Bronze, 6000);
    account.value.currentBalance = 100;
    const result = service.evaluateTierChange(account, program);
    expect(result.changed).toBe(true);
    expect(result.newTier).toBe(CustomerTier.Gold);
  });
});
