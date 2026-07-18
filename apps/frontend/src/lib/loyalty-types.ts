'use client';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'custom';

export type RewardType = 'discount' | 'free_product' | 'priority_reservation' | 'exclusive_experience' | 'custom';

export type PointsTransactionType = 'earn' | 'redeem' | 'bonus' | 'adjustment' | 'expiration' | 'refund';

export type RedemptionStatus = 'requested' | 'validated' | 'approved' | 'completed' | 'cancelled';

export interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerCurrencyUnit: number;
  tiers: TierConfig[];
}

export interface TierConfig {
  name: string;
  minimumLifetimePoints: number;
  pointsMultiplier: number;
  benefits: string[];
}

export interface LoyaltyDashboardData {
  totalEnrolled: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalPointsBalance: number;
  tierDistribution: Record<string, number>;
  totalRewardsAvailable: number;
  totalRewardsRedeemed: number;
  totalSpent: number;
  averageSpentPerMember: number;
  recentRedemptions: RecentRedemption[];
  activeProgram: LoyaltyProgram | null;
}

export interface RecentRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  status: RedemptionStatus;
  requestedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  costInPoints: number;
  value: number;
  valueCurrency: string;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  remainingQuantity: number | null;
  isCurrentlyAvailable: boolean;
}

export interface LoyaltyProfile {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  tier: LoyaltyTier;
  totalSpent: number;
  totalVisits: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  tags: string[];
  isActive: boolean;
  enrolledAt: string;
}

export interface LoyaltyAccount {
  id: string;
  currentBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  currentTier: LoyaltyTier;
  isActive: boolean;
  enrolledAt: string;
  lastActivityAt: string;
}

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: string;
  description: string;
  createdAt: string;
}

export interface LoyaltyRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  status: RedemptionStatus;
  requestedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface CustomerLoyaltyData {
  profile: LoyaltyProfile;
  account: LoyaltyAccount | null;
  transactions: PointsTransaction[];
  redemptions: LoyaltyRedemption[];
  segments: LoyaltySegment[];
}

export interface LoyaltySegment {
  id: string;
  name: string;
  description: string;
}

export const TIER_OPTIONS: { value: LoyaltyTier; label: string }[] = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'custom', label: 'Custom' },
];

export const REWARD_TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: 'discount', label: 'Discount' },
  { value: 'free_product', label: 'Free Product' },
  { value: 'priority_reservation', label: 'Priority Reservation' },
  { value: 'exclusive_experience', label: 'Exclusive Experience' },
  { value: 'custom', label: 'Custom' },
];

export function getTierColor(tier: LoyaltyTier): 'default' | 'secondary' | 'warning' | 'info' {
  switch (tier) {
    case 'bronze': return 'secondary';
    case 'silver': return 'default';
    case 'gold': return 'warning';
    case 'platinum': return 'info';
    case 'custom': return 'info';
  }
}

export function getRedemptionStatusColor(status: RedemptionStatus): 'warning' | 'info' | 'success' | 'secondary' | 'danger' {
  switch (status) {
    case 'requested': return 'warning';
    case 'validated': return 'info';
    case 'approved': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'secondary';
  }
}

export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function formatTierLabel(tier: LoyaltyTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
