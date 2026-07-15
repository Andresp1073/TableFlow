import type { CustomerProfileRepository } from "../../domain/repositories/CustomerProfileRepository.js";
import type { PointsAccountRepository } from "../../domain/repositories/PointsAccountRepository.js";
import type { RewardRepository } from "../../domain/repositories/RewardRepository.js";
import type { LoyaltyProgramRepository } from "../../domain/repositories/LoyaltyProgramRepository.js";
import { CustomerProfile } from "../../domain/models/CustomerProfile.js";
import { PointsEngine } from "../../domain/services/PointsEngine.js";
import { RewardService } from "../../domain/services/RewardService.js";
import { RedemptionService } from "../../domain/services/RedemptionService.js";
import { TierService } from "../../domain/services/TierService.js";
import { SegmentationService } from "../../domain/services/SegmentationService.js";
import { CustomerRegistered } from "../../domain/events/CustomerRegistered.js";
import { PointsEarned } from "../../domain/events/PointsEarned.js";
import { PointsRedeemed } from "../../domain/events/PointsRedeemed.js";
import { RewardRedeemed } from "../../domain/events/RewardRedeemed.js";
import { PointsAccount } from "../../domain/models/PointsAccount.js";
import type { PointsTransaction } from "../../domain/models/PointsTransaction.js";

export class LoyaltyManager {
  private readonly pointsEngine: PointsEngine;
  private readonly rewardService: RewardService;
  private readonly redemptionService: RedemptionService;
  private readonly tierService: TierService;
  private readonly segmentationService: SegmentationService;
  readonly events: unknown[] = [];

  constructor(
    private readonly customerProfileRepo: CustomerProfileRepository,
    private readonly pointsAccountRepo: PointsAccountRepository,
    private readonly rewardRepo: RewardRepository,
    private readonly programRepo: LoyaltyProgramRepository,
  ) {
    this.pointsEngine = new PointsEngine();
    this.rewardService = new RewardService();
    this.redemptionService = new RedemptionService(this.rewardService);
    this.tierService = new TierService();
    this.segmentationService = new SegmentationService();
  }

  async registerCustomer(config: {
    id: string;
    restaurantId: string;
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    anniversaryDate?: string;
    programId: string;
    performedBy: string;
  }): Promise<{ profile: CustomerProfile; account: PointsAccount }> {
    const existing = await this.customerProfileRepo.findByEmail(config.email, config.restaurantId);
    if (existing) throw new Error("Customer already registered in loyalty program");

    const program = await this.programRepo.findById(config.programId);
    if (!program) throw new Error("Loyalty program not found");

    const profile = CustomerProfile.create({
      id: config.id,
      restaurantId: config.restaurantId,
      customerId: config.customerId,
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      phone: config.phone,
      dateOfBirth: config.dateOfBirth,
      anniversaryDate: config.anniversaryDate,
      preferences: {
        favoriteCuisines: [],
        dietaryRestrictions: [],
        seatingPreferences: [],
        marketingOptIn: true,
      },
    });

    let account = PointsAccount.create({
      id: crypto.randomUUID(),
      customerProfileId: profile.id,
      programId: config.programId,
      restaurantId: config.restaurantId,
    });

    if (program.enrollmentBonusPoints > 0) {
      const result = this.pointsEngine.awardBonus(
        account, program.enrollmentBonusPoints,
        "Enrollment bonus", profile.id, config.performedBy,
      );
      await this.pointsAccountRepo.saveTransaction(result.transaction);
      account = result.account;
    }

    await this.customerProfileRepo.save(profile);
    await this.pointsAccountRepo.save(account);

    this.events.push(new CustomerRegistered(
      profile.id, config.customerId, config.restaurantId,
      config.email, config.programId, account.id,
    ));

    return { profile, account };
  }

  async earnPoints(config: {
    restaurantId: string;
    customerProfileId: string;
    spentAmount: number;
    referenceId: string;
    referenceType: string;
    performedBy: string;
  }): Promise<{ transaction: PointsTransaction; account: PointsAccount }> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(config.customerProfileId);
    if (accounts.length === 0) throw new Error("No loyalty account found for customer");

    const account = accounts[0];
    const program = await this.programRepo.findById(account.programId);
    if (!program) throw new Error("Loyalty program not found");

    const policy = await this.programRepo.findPolicyByRestaurant(config.restaurantId);
    if (!policy) throw new Error("Loyalty policy not found");

    const tierConfig = program.getTierForPoints(account.lifetimePointsEarned);
    const result = this.pointsEngine.earnPoints(
      account, program, policy, config.spentAmount,
      tierConfig.pointsMultiplier, config.referenceId,
      config.referenceType, config.performedBy,
    );

    await this.pointsAccountRepo.save(result.account);
    await this.pointsAccountRepo.saveTransaction(result.transaction);

    const tierResult = this.tierService.evaluateTierChange(result.account, program);
    if (tierResult.changed) {
      const profile = await this.customerProfileRepo.findById(config.customerProfileId);
      if (profile) {
        this.tierService.applyTierChange(result.account, profile, tierResult.newTier);
        await this.customerProfileRepo.save(profile);
        this.events.push(tierResult.event!);
      }
    }

    this.events.push(new PointsEarned(
      result.transaction.id, account.id, config.customerProfileId,
      config.restaurantId, result.transaction.points,
      result.account.currentBalance, config.referenceId, config.referenceType,
    ));

    return { transaction: result.transaction, account: result.account };
  }

  async redeemReward(config: {
    restaurantId: string;
    customerProfileId: string;
    rewardId: string;
    referenceId: string;
    performedBy: string;
  }): Promise<{
    redemption: import("../../domain/models/RewardRedemption.js").RewardRedemption;
    transaction: PointsTransaction;
    account: PointsAccount;
  }> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(config.customerProfileId);
    if (accounts.length === 0) throw new Error("No loyalty account found");

    const account = accounts[0];
    const reward = await this.rewardRepo.findById(config.rewardId);
    if (!reward) throw new Error("Reward not found");

    const policy = await this.programRepo.findPolicyByRestaurant(config.restaurantId);
    if (!policy) throw new Error("Loyalty policy not found");

    const previousRedemptions = await this.rewardRepo.countRedemptionsByCustomerAndReward(
      config.customerProfileId, config.rewardId,
    );
    const dailyRedemptions = await this.rewardRepo.countDailyRedemptions(config.restaurantId);

    const { redemption } = this.redemptionService.requestRedemption(
      account, reward, policy, config.customerProfileId,
      config.restaurantId, previousRedemptions, dailyRedemptions, config.referenceId,
    );

    const pointsResult = this.pointsEngine.redeemPoints(
      account, reward.costInPoints, config.referenceId, "reward_redemption", config.performedBy,
    );

    const updatedReward = reward.redeem();
    await this.rewardRepo.save(updatedReward);
    await this.pointsAccountRepo.save(pointsResult.account);
    await this.pointsAccountRepo.saveTransaction(pointsResult.transaction);
    await this.rewardRepo.saveRedemption(redemption);

    this.events.push(new PointsRedeemed(
      pointsResult.transaction.id, redemption.id, account.id,
      config.customerProfileId, config.restaurantId,
      reward.costInPoints, config.rewardId, pointsResult.account.currentBalance,
    ));
    this.events.push(new RewardRedeemed(
      redemption.id, reward.id, reward.name,
      config.customerProfileId, config.restaurantId, reward.costInPoints,
    ));

    return { redemption, transaction: pointsResult.transaction, account: pointsResult.account };
  }

  async awardBonus(config: {
    restaurantId: string;
    customerProfileId: string;
    points: number;
    reason: string;
    performedBy: string;
  }): Promise<{ transaction: PointsTransaction; account: PointsAccount }> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(config.customerProfileId);
    if (accounts.length === 0) throw new Error("No loyalty account found");
    const account = accounts[0];
    const result = this.pointsEngine.awardBonus(account, config.points, config.reason, config.customerProfileId, config.performedBy);
    await this.pointsAccountRepo.save(result.account);
    await this.pointsAccountRepo.saveTransaction(result.transaction);
    return { transaction: result.transaction, account: result.account };
  }

  async adjustPoints(config: {
    restaurantId: string;
    customerProfileId: string;
    points: number;
    reason: string;
    performedBy: string;
  }): Promise<{ transaction: PointsTransaction; account: PointsAccount }> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(config.customerProfileId);
    if (accounts.length === 0) throw new Error("No loyalty account found");
    const account = accounts[0];
    const result = this.pointsEngine.adjustPoints(account, config.points, config.reason, config.performedBy);
    await this.pointsAccountRepo.save(result.account);
    await this.pointsAccountRepo.saveTransaction(result.transaction);
    return { transaction: result.transaction, account: result.account };
  }

  async reverseTransaction(config: {
    restaurantId: string;
    customerProfileId: string;
    transactionId: string;
    performedBy: string;
  }): Promise<{ transaction: PointsTransaction; account: PointsAccount }> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(config.customerProfileId);
    if (accounts.length === 0) throw new Error("No loyalty account found");
    const account = accounts[0];
    const transactions = await this.pointsAccountRepo.findTransactionsByAccountId(account.id);
    const original = transactions.find((t) => t.id === config.transactionId);
    if (!original) throw new Error("Transaction not found");
    const result = this.pointsEngine.reverseTransaction(account, original, config.performedBy);
    await this.pointsAccountRepo.save(result.account);
    await this.pointsAccountRepo.saveTransaction(result.transaction);
    return { transaction: result.transaction, account: result.account };
  }

  async getCustomerProfile(customerProfileId: string): Promise<CustomerProfile | null> {
    return this.customerProfileRepo.findById(customerProfileId);
  }

  async getPointsAccount(customerProfileId: string): Promise<PointsAccount | null> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(customerProfileId);
    return accounts[0] ?? null;
  }

  async getTransactionHistory(customerProfileId: string): Promise<PointsTransaction[]> {
    const accounts = await this.pointsAccountRepo.findByCustomerProfileId(customerProfileId);
    if (accounts.length === 0) return [];
    return this.pointsAccountRepo.findTransactionsByAccountId(accounts[0].id);
  }

  getPointsEngine(): PointsEngine { return this.pointsEngine; }
  getRewardService(): RewardService { return this.rewardService; }
  getRedemptionService(): RedemptionService { return this.redemptionService; }
  getTierService(): TierService { return this.tierService; }
  getSegmentationService(): SegmentationService { return this.segmentationService; }
}
