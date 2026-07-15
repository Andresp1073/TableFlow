import type { CustomerProfileRepository } from "../../domain/repositories/CustomerProfileRepository.js";
import type { PointsAccountRepository } from "../../domain/repositories/PointsAccountRepository.js";
import type { RewardRepository } from "../../domain/repositories/RewardRepository.js";
import type { LoyaltyProgramRepository } from "../../domain/repositories/LoyaltyProgramRepository.js";
import type { CustomerProfile } from "../../domain/models/CustomerProfile.js";
import type { PointsAccount } from "../../domain/models/PointsAccount.js";
import type { PointsTransaction } from "../../domain/models/PointsTransaction.js";
import type { Reward } from "../../domain/models/Reward.js";
import type { RewardRedemption } from "../../domain/models/RewardRedemption.js";
import type { LoyaltyProgram } from "../../domain/models/LoyaltyProgram.js";
import type { CustomerSegment } from "../../domain/models/CustomerSegment.js";
import type { LoyaltyPolicy } from "../../domain/models/LoyaltyPolicy.js";

export class InMemoryCustomerProfileRepository implements CustomerProfileRepository {
  private readonly profiles: Map<string, CustomerProfile> = new Map();

  async findById(id: string): Promise<CustomerProfile | null> {
    return this.profiles.get(id) ?? null;
  }

  async findByCustomerId(customerId: string, restaurantId: string): Promise<CustomerProfile | null> {
    for (const p of this.profiles.values()) {
      if (p.customerId === customerId && p.restaurantId === restaurantId) return p;
    }
    return null;
  }

  async findByEmail(email: string, restaurantId: string): Promise<CustomerProfile | null> {
    for (const p of this.profiles.values()) {
      if (p.email === email && p.restaurantId === restaurantId) return p;
    }
    return null;
  }

  async findByRestaurant(restaurantId: string): Promise<CustomerProfile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.restaurantId === restaurantId);
  }

  async findByTier(tier: string, restaurantId: string): Promise<CustomerProfile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.tier === tier && p.restaurantId === restaurantId);
  }

  async findByTag(tag: string, restaurantId: string): Promise<CustomerProfile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.tags.includes(tag) && p.restaurantId === restaurantId);
  }

  async save(profile: CustomerProfile): Promise<void> {
    this.profiles.set(profile.id, profile);
  }

  async delete(id: string): Promise<void> {
    this.profiles.delete(id);
  }
}

export class InMemoryPointsAccountRepository implements PointsAccountRepository {
  private readonly accounts: Map<string, PointsAccount> = new Map();
  private readonly transactions: Map<string, PointsTransaction> = new Map();

  async findById(id: string): Promise<PointsAccount | null> {
    return this.accounts.get(id) ?? null;
  }

  async findByCustomerProfileId(customerProfileId: string): Promise<PointsAccount[]> {
    return Array.from(this.accounts.values()).filter((a) => a.customerProfileId === customerProfileId);
  }

  async findByProgramId(programId: string): Promise<PointsAccount[]> {
    return Array.from(this.accounts.values()).filter((a) => a.programId === programId);
  }

  async findByRestaurant(restaurantId: string): Promise<PointsAccount[]> {
    return Array.from(this.accounts.values()).filter((a) => a.restaurantId === restaurantId);
  }

  async save(account: PointsAccount): Promise<void> {
    this.accounts.set(account.id, account);
  }

  async delete(id: string): Promise<void> {
    this.accounts.delete(id);
  }

  async findTransactionsByAccountId(accountId: string): Promise<PointsTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.accountId === accountId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findTransactionsByReference(referenceId: string): Promise<PointsTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.referenceId === referenceId);
  }

  async saveTransaction(transaction: PointsTransaction): Promise<void> {
    this.transactions.set(transaction.id, transaction);
  }
}

export class InMemoryRewardRepository implements RewardRepository {
  private readonly rewards: Map<string, Reward> = new Map();
  private readonly redemptions: Map<string, RewardRedemption> = new Map();

  async findById(id: string): Promise<Reward | null> {
    return this.rewards.get(id) ?? null;
  }

  async findByProgramId(programId: string): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter((r) => r.programId === programId);
  }

  async findByRestaurant(restaurantId: string): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter((r) => r.restaurantId === restaurantId);
  }

  async findAvailable(restaurantId: string): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter((r) => r.restaurantId === restaurantId && r.isCurrentlyAvailable());
  }

  async save(reward: Reward): Promise<void> {
    this.rewards.set(reward.id, reward);
  }

  async delete(id: string): Promise<void> {
    this.rewards.delete(id);
  }

  async findRedemptionById(id: string): Promise<RewardRedemption | null> {
    return this.redemptions.get(id) ?? null;
  }

  async findRedemptionsByCustomerProfileId(customerProfileId: string): Promise<RewardRedemption[]> {
    return Array.from(this.redemptions.values()).filter((r) => r.customerProfileId === customerProfileId);
  }

  async findRedemptionsByRewardId(rewardId: string): Promise<RewardRedemption[]> {
    return Array.from(this.redemptions.values()).filter((r) => r.rewardId === rewardId);
  }

  async findRedemptionsByStatus(status: string, restaurantId: string): Promise<RewardRedemption[]> {
    return Array.from(this.redemptions.values()).filter((r) => r.status === status && r.restaurantId === restaurantId);
  }

  async countRedemptionsByCustomerAndReward(customerProfileId: string, rewardId: string): Promise<number> {
    return Array.from(this.redemptions.values()).filter(
      (r) => r.customerProfileId === customerProfileId && r.rewardId === rewardId,
    ).length;
  }

  async countDailyRedemptions(restaurantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.redemptions.values()).filter(
      (r) => r.restaurantId === restaurantId && r.requestedAt >= today,
    ).length;
  }

  async saveRedemption(redemption: RewardRedemption): Promise<void> {
    this.redemptions.set(redemption.id, redemption);
  }
}

export class InMemoryLoyaltyProgramRepository implements LoyaltyProgramRepository {
  private readonly programs: Map<string, LoyaltyProgram> = new Map();
  private readonly segments: Map<string, CustomerSegment> = new Map();
  private readonly policies: Map<string, LoyaltyPolicy> = new Map();

  async findById(id: string): Promise<LoyaltyProgram | null> {
    return this.programs.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<LoyaltyProgram[]> {
    return Array.from(this.programs.values()).filter((p) => p.restaurantId === restaurantId);
  }

  async findActiveByRestaurant(restaurantId: string): Promise<LoyaltyProgram[]> {
    return Array.from(this.programs.values()).filter((p) => p.restaurantId === restaurantId && p.isCurrentlyActive());
  }

  async save(program: LoyaltyProgram): Promise<void> {
    this.programs.set(program.id, program);
  }

  async delete(id: string): Promise<void> {
    this.programs.delete(id);
  }

  async findSegmentById(id: string): Promise<CustomerSegment | null> {
    return this.segments.get(id) ?? null;
  }

  async findSegmentsByRestaurant(restaurantId: string): Promise<CustomerSegment[]> {
    return Array.from(this.segments.values()).filter((s) => s.restaurantId === restaurantId);
  }

  async saveSegment(segment: CustomerSegment): Promise<void> {
    this.segments.set(segment.id, segment);
  }

  async deleteSegment(id: string): Promise<void> {
    this.segments.delete(id);
  }

  async findPolicyById(id: string): Promise<LoyaltyPolicy | null> {
    return this.policies.get(id) ?? null;
  }

  async findPolicyByRestaurant(restaurantId: string): Promise<LoyaltyPolicy | null> {
    for (const p of this.policies.values()) {
      if (p.restaurantId === restaurantId) return p;
    }
    return null;
  }

  async savePolicy(policy: LoyaltyPolicy): Promise<void> {
    this.policies.set(policy.id, policy);
  }
}
