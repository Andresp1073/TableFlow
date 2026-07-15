import type { LoyaltyProgram } from "../../domain/models/LoyaltyProgram.js";
import type { CustomerSegment } from "../../domain/models/CustomerSegment.js";
import type { LoyaltyPolicy } from "../../domain/models/LoyaltyPolicy.js";

export type LoyaltyProgramDto = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pointsPerCurrencyUnit: number;
  tiers: Array<{ name: string; minimumLifetimePoints: number; pointsMultiplier: number; benefits: string[] }>;
  isActive: boolean;
  startAt: string;
  endAt: string | null;
};

export function toLoyaltyProgramDto(program: LoyaltyProgram): LoyaltyProgramDto {
  return {
    id: program.id,
    restaurantId: program.restaurantId,
    name: program.name,
    description: program.description,
    pointsPerCurrencyUnit: program.pointsPerCurrencyUnit,
    tiers: program.tiers.map((t) => ({ ...t })),
    isActive: program.isActive,
    startAt: program.startAt.toISOString(),
    endAt: program.endAt?.toISOString() ?? null,
  };
}

export type CustomerSegmentDto = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  isActive: boolean;
};

export function toCustomerSegmentDto(segment: CustomerSegment): CustomerSegmentDto {
  return {
    id: segment.id,
    restaurantId: segment.restaurantId,
    name: segment.name,
    description: segment.description,
    criteria: segment.criteria as Record<string, unknown>,
    isActive: segment.isActive,
  };
}

export type LoyaltyPolicyDto = {
  id: string;
  restaurantId: string;
  name: string;
  pointsExpirationDays: number | null;
  minimumRedemptionPoints: number;
  maximumPointsPerTransaction: number | null;
  enrollmentBonusPoints: number;
  birthdayBonusPoints: number;
  redemptionRequiresValidation: boolean;
  redemptionRequiresApproval: boolean;
  maximumRedemptionsPerDay: number | null;
  isActive: boolean;
};

export function toLoyaltyPolicyDto(policy: LoyaltyPolicy): LoyaltyPolicyDto {
  return {
    id: policy.id,
    restaurantId: policy.restaurantId,
    name: policy.name,
    pointsExpirationDays: policy.pointsExpirationDays,
    minimumRedemptionPoints: policy.minimumRedemptionPoints,
    maximumPointsPerTransaction: policy.maximumPointsPerTransaction,
    enrollmentBonusPoints: policy.enrollmentBonusPoints,
    birthdayBonusPoints: policy.birthdayBonusPoints,
    redemptionRequiresValidation: policy.redemptionRequiresValidation,
    redemptionRequiresApproval: policy.redemptionRequiresApproval,
    maximumRedemptionsPerDay: policy.maximumRedemptionsPerDay,
    isActive: policy.isActive,
  };
}
