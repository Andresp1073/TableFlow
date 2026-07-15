import type { Reward } from "../../domain/models/Reward.js";
import type { RewardRedemption } from "../../domain/models/RewardRedemption.js";

export type RewardDto = {
  id: string;
  programId: string;
  restaurantId: string;
  name: string;
  description: string;
  type: string;
  costInPoints: number;
  value: number;
  valueCurrency: string;
  termsConditions: string;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  remainingQuantity: number | null;
};

export function toRewardDto(reward: Reward): RewardDto {
  return {
    id: reward.id,
    programId: reward.programId,
    restaurantId: reward.restaurantId,
    name: reward.name,
    description: reward.description,
    type: reward.type,
    costInPoints: reward.costInPoints,
    value: reward.monetaryValue,
    valueCurrency: reward.valueCurrency,
    termsConditions: reward.termsConditions,
    isActive: reward.isActive,
    validFrom: reward.validFrom.toISOString(),
    validTo: reward.validTo?.toISOString() ?? null,
    remainingQuantity: reward.remainingQuantity,
  };
}

export type RewardRedemptionDto = {
  id: string;
  rewardId: string;
  rewardName: string;
  accountId: string;
  customerProfileId: string;
  restaurantId: string;
  status: string;
  pointsCost: number;
  referenceId: string;
  requestedAt: string;
  validatedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
};

export function toRewardRedemptionDto(redemption: RewardRedemption): RewardRedemptionDto {
  return {
    id: redemption.id,
    rewardId: redemption.rewardId,
    rewardName: redemption.rewardName,
    accountId: redemption.accountId,
    customerProfileId: redemption.customerProfileId,
    restaurantId: redemption.restaurantId,
    status: redemption.status,
    pointsCost: redemption.pointsCost,
    referenceId: redemption.referenceId,
    requestedAt: redemption.requestedAt.toISOString(),
    validatedAt: redemption.validatedAt?.toISOString() ?? null,
    approvedBy: redemption.approvedBy,
    approvedAt: redemption.approvedAt?.toISOString() ?? null,
    completedAt: redemption.completedAt?.toISOString() ?? null,
    cancelledAt: redemption.cancelledAt?.toISOString() ?? null,
    cancellationReason: redemption.cancellationReason,
  };
}
