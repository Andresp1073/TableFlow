import type { Response } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../../../utils/response.js';
import type { AuthenticatedRequest } from '../../../../middlewares/auth.js';
import { LoyaltyManager } from '../../application/services/LoyaltyManager.js';
import { CustomerEngagementService } from '../../application/services/CustomerEngagementService.js';
import {
  InMemoryCustomerProfileRepository,
  InMemoryPointsAccountRepository,
  InMemoryRewardRepository,
  InMemoryLoyaltyProgramRepository,
} from '../../infrastructure/repositories/InMemoryLoyaltyRepositories.js';

export function createLoyaltyController() {
  const customerProfileRepo = new InMemoryCustomerProfileRepository();
  const pointsAccountRepo = new InMemoryPointsAccountRepository();
  const rewardRepo = new InMemoryRewardRepository();
  const programRepo = new InMemoryLoyaltyProgramRepository();

  const loyaltyManager = new LoyaltyManager(
    customerProfileRepo,
    pointsAccountRepo,
    rewardRepo,
    programRepo,
  );

  const engagementService = new CustomerEngagementService(
    customerProfileRepo,
    programRepo,
  );

  return {
    getLoyaltyDashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const profiles = await customerProfileRepo.findByRestaurant(restaurantId);
      const accounts = await pointsAccountRepo.findByRestaurant(restaurantId);
      const availableRewards = await rewardRepo.findAvailable(restaurantId);
      const programs = await programRepo.findByRestaurant(restaurantId);

      const totalEnrolled = profiles.length;
      const activeMembers = profiles.filter((p) => p.isActive).length;
      const totalPointsIssued = accounts.reduce((sum, a) => sum + a.lifetimePointsEarned, 0);
      const totalPointsRedeemed = accounts.reduce((sum, a) => sum + a.lifetimePointsRedeemed, 0);
      const totalPointsBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

      const tierDistribution: Record<string, number> = {};
      for (const p of profiles) {
        tierDistribution[p.tier] = (tierDistribution[p.tier] || 0) + 1;
      }

      const totalRewardsAvailable = availableRewards.length;
      const totalRewardsRedeemed = await Promise.all(
        profiles.map((p) => rewardRepo.findRedemptionsByCustomerProfileId(p.id)),
      ).then((results) => results.reduce((sum, reds) => sum + reds.length, 0));

      const totalSpent = profiles.reduce((sum, p) => sum + p.totalSpent, 0);
      const averageSpentPerMember = totalEnrolled > 0 ? Math.round(totalSpent / totalEnrolled) : 0;

      const allRedemptions = await Promise.all(
        profiles.map((p) => rewardRepo.findRedemptionsByCustomerProfileId(p.id)),
      ).then((results) => results.flat());

      const recentRedemptions = allRedemptions
        .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
        .slice(0, 10)
        .map((r) => ({
          id: r.id,
          rewardId: r.rewardId,
          rewardName: r.rewardName,
          pointsCost: r.pointsCost,
          status: r.status,
          requestedAt: r.requestedAt.toISOString(),
        }));

      sendSuccess(res, {
        totalEnrolled,
        activeMembers,
        totalPointsIssued,
        totalPointsRedeemed,
        totalPointsBalance,
        tierDistribution,
        totalRewardsAvailable,
        totalRewardsRedeemed,
        totalSpent,
        averageSpentPerMember,
        recentRedemptions,
        activeProgram: programs.find((p) => p.isCurrentlyActive()) ? {
          id: programs[0].id,
          name: programs[0].name,
          pointsPerCurrencyUnit: programs[0].pointsPerCurrencyUnit,
          tiers: programs[0].tiers,
        } : null,
      });
    }),

    getRewards: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const rewards = await rewardRepo.findByRestaurant(restaurantId);
      const data = rewards.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        costInPoints: r.costInPoints,
        value: r.monetaryValue,
        valueCurrency: r.valueCurrency,
        isActive: r.isActive,
        validFrom: r.validFrom.toISOString(),
        validTo: r.validTo?.toISOString() ?? null,
        remainingQuantity: r.remainingQuantity,
        isCurrentlyAvailable: r.isCurrentlyAvailable(),
      }));
      sendSuccess(res, data);
    }),

    registerCustomer: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { customerId, firstName, lastName, email, phone, dateOfBirth, programId } = req.body;
      const config = {
        id: `loyalty_${Date.now()}`,
        restaurantId,
        customerId,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        programId,
        performedBy: req.userId ?? 'system',
      };
      const result = await loyaltyManager.registerCustomer(config);
      sendCreated(res, {
        profileId: result.profile.id,
        accountId: result.account.id,
        currentBalance: result.account.currentBalance,
        tier: result.profile.tier,
      });
    }),

    getCustomerProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { customerProfileId } = req.params;
      const profile = await loyaltyManager.getCustomerProfile(customerProfileId);
      if (!profile) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Loyalty profile not found' } });
        return;
      }
      const account = await loyaltyManager.getPointsAccount(customerProfileId);
      const transactions = await loyaltyManager.getTransactionHistory(customerProfileId);
      const redemptions = await rewardRepo.findRedemptionsByCustomerProfileId(customerProfileId);
      const segments = await engagementService.getProfileSegments(customerProfileId);

      sendSuccess(res, {
        profile: {
          id: profile.id,
          customerId: profile.customerId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          tier: profile.tier,
          totalSpent: profile.totalSpent,
          totalVisits: profile.totalVisits,
          firstVisitAt: profile.firstVisitAt?.toISOString() ?? null,
          lastVisitAt: profile.lastVisitAt?.toISOString() ?? null,
          tags: [...profile.tags],
          isActive: profile.isActive,
          enrolledAt: profile.enrolledAt.toISOString(),
        },
        account: account ? {
          id: account.id,
          currentBalance: account.currentBalance,
          lifetimePointsEarned: account.lifetimePointsEarned,
          lifetimePointsRedeemed: account.lifetimePointsRedeemed,
          currentTier: account.currentTier,
          isActive: account.isActive,
          enrolledAt: account.enrolledAt.toISOString(),
          lastActivityAt: account.lastActivityAt.toISOString(),
        } : null,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          points: t.points,
          balanceBefore: t.balanceBefore,
          balanceAfter: t.balanceAfter,
          referenceId: t.referenceId,
          referenceType: t.referenceType,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
        redemptions: redemptions.map((r) => ({
          id: r.id,
          rewardId: r.rewardId,
          rewardName: r.rewardName,
          pointsCost: r.pointsCost,
          status: r.status,
          requestedAt: r.requestedAt.toISOString(),
          completedAt: r.completedAt?.toISOString() ?? null,
          cancelledAt: r.cancelledAt?.toISOString() ?? null,
        })),
        segments: segments.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
        })),
      });
    }),

    earnPoints: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { customerProfileId, spentAmount, referenceId, referenceType } = req.body;
      const result = await loyaltyManager.earnPoints({
        restaurantId,
        customerProfileId,
        spentAmount,
        referenceId,
        referenceType,
        performedBy: req.userId ?? 'system',
      });
      sendSuccess(res, {
        transactionId: result.transaction.id,
        points: result.transaction.points,
        balanceAfter: result.account.currentBalance,
      });
    }),

    redeemReward: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { customerProfileId, rewardId, referenceId } = req.body;
      const result = await loyaltyManager.redeemReward({
        restaurantId,
        customerProfileId,
        rewardId,
        referenceId,
        performedBy: req.userId ?? 'system',
      });
      sendCreated(res, {
        redemptionId: result.redemption.id,
        transactionId: result.transaction.id,
        pointsCost: result.transaction.points,
        balanceAfter: result.account.currentBalance,
        status: result.redemption.status,
      });
    }),

    adjustPoints: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { customerProfileId, points, reason } = req.body;
      const result = await loyaltyManager.adjustPoints({
        restaurantId,
        customerProfileId,
        points,
        reason,
        performedBy: req.userId ?? 'system',
      });
      sendSuccess(res, {
        transactionId: result.transaction.id,
        points: result.transaction.points,
        balanceAfter: result.account.currentBalance,
      });
    }),

    getTransactionHistory: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { customerProfileId } = req.params;
      const transactions = await loyaltyManager.getTransactionHistory(customerProfileId);
      sendSuccess(res, transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        description: t.description,
        referenceId: t.referenceId,
        referenceType: t.referenceType,
        createdAt: t.createdAt.toISOString(),
      })));
    }),

    getBirthdays: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const profiles = await engagementService.getBirthdayProfiles(restaurantId);
      sendSuccess(res, profiles.map((p) => ({
        id: p.id,
        customerId: p.customerId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        dateOfBirth: p.dateOfBirth,
      })));
    }),
  };
}
