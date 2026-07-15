import { describe, it, expect } from "vitest";
import { LoyaltyManager } from "../application/services/LoyaltyManager.js";
import { CustomerEngagementService } from "../application/services/CustomerEngagementService.js";
import {
  InMemoryCustomerProfileRepository,
  InMemoryPointsAccountRepository,
  InMemoryRewardRepository,
  InMemoryLoyaltyProgramRepository,
} from "../infrastructure/repositories/InMemoryLoyaltyRepositories.js";
import { LoyaltyProgram } from "../domain/models/LoyaltyProgram.js";
import { LoyaltyPolicy } from "../domain/models/LoyaltyPolicy.js";
import { Reward, RewardType } from "../domain/models/Reward.js";
import { CustomerSegment } from "../domain/models/CustomerSegment.js";
import { CustomerProfile, CustomerTier } from "../domain/models/CustomerProfile.js";
import { PointsTransactionType } from "../domain/models/PointsTransaction.js";

describe("Loyalty Integration", () => {
  it("registers a customer and earns/redeems points", async () => {
    const profileRepo = new InMemoryCustomerProfileRepository();
    const accountRepo = new InMemoryPointsAccountRepository();
    const rewardRepo = new InMemoryRewardRepository();
    const programRepo = new InMemoryLoyaltyProgramRepository();

    const manager = new LoyaltyManager(profileRepo, accountRepo, rewardRepo, programRepo);

    const program = LoyaltyProgram.create({
      id: "prog-1", restaurantId: "rest-1", name: "Main Program",
      description: "Main loyalty program", pointsPerCurrencyUnit: 10, currencyUnit: "USD",
      tiers: [
        { name: "Bronze", minimumLifetimePoints: 0, pointsMultiplier: 1, benefits: [] },
        { name: "Silver", minimumLifetimePoints: 1000, pointsMultiplier: 1.5, benefits: ["Priority seating"] },
      ],
      rules: [], enrollmentBonusPoints: 100, birthdayBonusPoints: 50,
      pointsExpirationDays: null, minimumRedemptionPoints: 100,
      startAt: new Date("2024-01-01"), endAt: null,
    });
    await programRepo.save(program);

    const policy = LoyaltyPolicy.create({
      id: "pol-1", restaurantId: "rest-1", name: "Default",
      description: "Default policy", pointsExpirationDays: null,
      minimumRedemptionPoints: 100, maximumPointsPerTransaction: null,
      enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
      pointsRounding: "round", allowNegativeBalance: false,
      redemptionRequiresValidation: false, redemptionRequiresApproval: false,
      maximumRedemptionsPerDay: null, daysUntilTierDowngrade: null,
      daysUntilTierUpgrade: null,
    });
    await programRepo.savePolicy(policy);

    const reg = await manager.registerCustomer({
      id: "cp-1", restaurantId: "rest-1", customerId: "cust-1",
      firstName: "Alice", lastName: "Smith", email: "alice@example.com",
      programId: "prog-1", performedBy: "system",
    });
    expect(reg.account.currentBalance).toBe(100);
    expect(reg.profile.tier).toBe(CustomerTier.Bronze);

    const earn = await manager.earnPoints({
      restaurantId: "rest-1", customerProfileId: "cp-1",
      spentAmount: 100, referenceId: "sale-1", referenceType: "sale",
      performedBy: "system",
    });
    expect(earn.transaction.type).toBe(PointsTransactionType.Earn);
    expect(earn.account.currentBalance).toBe(1100);

    const reward = Reward.create({
      id: "rew-1", programId: "prog-1", restaurantId: "rest-1",
      name: "$10 Discount", description: "Save $10",
      type: RewardType.Discount, costInPoints: 500,
      value: 10, valueCurrency: "USD",
      termsConditions: "Valid on next visit",
      validFrom: new Date("2024-01-01"), validTo: null,
      maxRedemptionsPerCustomer: 3, totalQuantity: 50, remainingQuantity: 50,
    });
    await rewardRepo.save(reward);

    const redeem = await manager.redeemReward({
      restaurantId: "rest-1", customerProfileId: "cp-1",
      rewardId: "rew-1", referenceId: "order-1", performedBy: "alice",
    });
    expect(redeem.redemption.status).toBe("completed");
    expect(redeem.transaction.type).toBe(PointsTransactionType.Redeem);
    expect(redeem.account.currentBalance).toBe(600);
  });

  it("handles bonus and adjustment operations", async () => {
    const profileRepo = new InMemoryCustomerProfileRepository();
    const accountRepo = new InMemoryPointsAccountRepository();
    const rewardRepo = new InMemoryRewardRepository();
    const programRepo = new InMemoryLoyaltyProgramRepository();

    const manager = new LoyaltyManager(profileRepo, accountRepo, rewardRepo, programRepo);

    const program = LoyaltyProgram.create({
      id: "prog-1", restaurantId: "rest-1", name: "Test",
      description: "Test", pointsPerCurrencyUnit: 10, currencyUnit: "USD",
      tiers: [{ name: "Bronze", minimumLifetimePoints: 0, pointsMultiplier: 1, benefits: [] }],
      rules: [], enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
      pointsExpirationDays: null, minimumRedemptionPoints: 0,
      startAt: new Date("2024-01-01"), endAt: null,
    });
    await programRepo.save(program);

    const policy = LoyaltyPolicy.create({
      id: "pol-1", restaurantId: "rest-1", name: "Default",
      description: "Default", pointsExpirationDays: null,
      minimumRedemptionPoints: 0, maximumPointsPerTransaction: null,
      enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
      pointsRounding: "round", allowNegativeBalance: false,
      redemptionRequiresValidation: false, redemptionRequiresApproval: false,
      maximumRedemptionsPerDay: null, daysUntilTierDowngrade: null,
      daysUntilTierUpgrade: null,
    });
    await programRepo.savePolicy(policy);

    await manager.registerCustomer({
      id: "cp-2", restaurantId: "rest-1", customerId: "cust-2",
      firstName: "Bob", lastName: "Jones", email: "bob@example.com",
      programId: "prog-1", performedBy: "system",
    });

    const bonus = await manager.awardBonus({
      restaurantId: "rest-1", customerProfileId: "cp-2",
      points: 500, reason: "Referral bonus", performedBy: "system",
    });
    expect(bonus.account.currentBalance).toBe(500);

    const adjust = await manager.adjustPoints({
      restaurantId: "rest-1", customerProfileId: "cp-2",
      points: -100, reason: "Correction", performedBy: "admin",
    });
    expect(adjust.account.currentBalance).toBe(400);
  });

  it("supports customer segmentation and engagement", async () => {
    const profileRepo = new InMemoryCustomerProfileRepository();
    const accountRepo = new InMemoryPointsAccountRepository();
    const rewardRepo = new InMemoryRewardRepository();
    const programRepo = new InMemoryLoyaltyProgramRepository();

    const engagement = new CustomerEngagementService(profileRepo, programRepo);

    const profile = await CustomerProfile.create({
      id: "cp-3", restaurantId: "rest-1", customerId: "cust-3",
      firstName: "Carol", lastName: "Davis", email: "carol@example.com",
      preferences: { favoriteCuisines: ["Italian"], marketingOptIn: true },
    });
    await profileRepo.save(profile);

    const segment = CustomerSegment.create({
      id: "seg-1", restaurantId: "rest-1", name: "Italian Lovers",
      description: "Customers who like Italian food",
      criteria: { preferredCuisines: ["Italian"] },
    });
    await programRepo.saveSegment(segment);

    const segments = await engagement.getProfileSegments("cp-3");
    expect(segments).toHaveLength(1);
    expect(segments[0].name).toBe("Italian Lovers");

    const profilesInSegment = await engagement.getProfilesBySegment("seg-1");
    expect(profilesInSegment).toHaveLength(1);

    const updated = await engagement.updatePreferences({
      customerProfileId: "cp-3",
      favoriteCuisines: ["Italian", "Japanese"],
    });
    expect(updated.preferences.favoriteCuisines).toContain("Japanese");

    const tagged = await engagement.addTag("cp-3", "birthday-month");
    expect(tagged.tags).toContain("birthday-month");
  });

  it("processes transaction reversal", async () => {
    const profileRepo = new InMemoryCustomerProfileRepository();
    const accountRepo = new InMemoryPointsAccountRepository();
    const rewardRepo = new InMemoryRewardRepository();
    const programRepo = new InMemoryLoyaltyProgramRepository();

    const manager = new LoyaltyManager(profileRepo, accountRepo, rewardRepo, programRepo);

    const program = LoyaltyProgram.create({
      id: "prog-1", restaurantId: "rest-1", name: "Test",
      description: "Test", pointsPerCurrencyUnit: 10, currencyUnit: "USD",
      tiers: [{ name: "Bronze", minimumLifetimePoints: 0, pointsMultiplier: 1, benefits: [] }],
      rules: [], enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
      pointsExpirationDays: null, minimumRedemptionPoints: 0,
      startAt: new Date("2024-01-01"), endAt: null,
    });
    await programRepo.save(program);

    const policy = LoyaltyPolicy.create({
      id: "pol-1", restaurantId: "rest-1", name: "Default",
      description: "Default", pointsExpirationDays: null,
      minimumRedemptionPoints: 0, maximumPointsPerTransaction: null,
      enrollmentBonusPoints: 0, birthdayBonusPoints: 0,
      pointsRounding: "round", allowNegativeBalance: false,
      redemptionRequiresValidation: false, redemptionRequiresApproval: false,
      maximumRedemptionsPerDay: null, daysUntilTierDowngrade: null,
      daysUntilTierUpgrade: null,
    });
    await programRepo.savePolicy(policy);

    await manager.registerCustomer({
      id: "cp-4", restaurantId: "rest-1", customerId: "cust-4",
      firstName: "Dave", lastName: "Lee", email: "dave@example.com",
      programId: "prog-1", performedBy: "system",
    });

    const earn = await manager.earnPoints({
      restaurantId: "rest-1", customerProfileId: "cp-4",
      spentAmount: 50, referenceId: "sale-2", referenceType: "sale",
      performedBy: "system",
    });

    const history = await manager.getTransactionHistory("cp-4");
    expect(history).toHaveLength(1);

    const reversal = await manager.reverseTransaction({
      restaurantId: "rest-1", customerProfileId: "cp-4",
      transactionId: earn.transaction.id, performedBy: "admin",
    });
    expect(reversal.transaction.type).toBe(PointsTransactionType.Refund);
    expect(reversal.account.currentBalance).toBe(0);
  });
});
