import type { Reward } from "../models/Reward.js";
import type { RewardRedemption } from "../models/RewardRedemption.js";

export interface RewardRepository {
  findById(id: string): Promise<Reward | null>;
  findByProgramId(programId: string): Promise<Reward[]>;
  findByRestaurant(restaurantId: string): Promise<Reward[]>;
  findAvailable(restaurantId: string): Promise<Reward[]>;
  save(reward: Reward): Promise<void>;
  delete(id: string): Promise<void>;

  findRedemptionById(id: string): Promise<RewardRedemption | null>;
  findRedemptionsByCustomerProfileId(customerProfileId: string): Promise<RewardRedemption[]>;
  findRedemptionsByRewardId(rewardId: string): Promise<RewardRedemption[]>;
  findRedemptionsByStatus(status: string, restaurantId: string): Promise<RewardRedemption[]>;
  countRedemptionsByCustomerAndReward(customerProfileId: string, rewardId: string): Promise<number>;
  countDailyRedemptions(restaurantId: string): Promise<number>;
  saveRedemption(redemption: RewardRedemption): Promise<void>;
}
