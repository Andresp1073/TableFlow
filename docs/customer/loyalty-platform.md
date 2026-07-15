# Enterprise Customer Loyalty Platform — Phase 14.5

## Overview

The Enterprise Customer Loyalty Platform is an independent bounded context within TableFlow, following Domain-Driven Design and Clean Architecture. It manages customer loyalty profiles, points accounting, rewards, redemptions, tier progression, and customer segmentation without external marketing provider dependencies.

## Architecture

```
modules/loyalty/
├── domain/
│   ├── models/                    # Aggregate roots & value objects
│   │   ├── CustomerProfile.ts     (# tier, preferences, visit history)
│   │   ├── LoyaltyProgram.ts      (# program config, tier thresholds, multipliers)
│   │   ├── PointsAccount.ts       (# balance, lifetime earned/redeemed)
│   │   ├── PointsTransaction.ts   (# 6 types: Earn/Redeem/Bonus/Adjustment/Expiration/Refund)
│   │   ├── Reward.ts              (# discount, free product, priority reservation, etc.)
│   │   ├── RewardRedemption.ts    (# 5-state FSM: Requested→Validated→Approved→Completed)
│   │   ├── CustomerSegment.ts     (# criteria-based: frequency, spending, engagement)
│   │   └── LoyaltyPolicy.ts       (# expiration, min redemption, rounding, validation)
│   ├── events/                    # 6 domain events
│   ├── repositories/              # Interfaces: CustomerProfile, PointsAccount, Reward, LoyaltyProgram
│   └── services/                  # PointsEngine, RewardService, RedemptionService, TierService, Segmentation
├── application/
│   ├── services/                  # LoyaltyManager, CustomerEngagementService
│   └── dtos/                      # PointsTransactionDto, RewardDto, CustomerProfileDto, LoyaltyProgramDto
├── infrastructure/
│   └── repositories/              # In-memory implementations
├── errors/                        # InsufficientPointsError, RewardError, LoyaltyProgramError
└── tests/                         # 6 test files, 54 tests
```

## Points Lifecycle

```
Earn       → Credit points (via sale, with tier multiplier)
Redeem     → Debit points (for rewards)
Bonus      → Credit points (enrollment, birthday, referral)
Adjustment → +/- points (corrections)
Expiration → Debit points (time-based expiry)
Refund     → Reverse any reversible transaction (earn, redeem, bonus)
```

## Redemption FSM

```
Requested → Validated → Approved → Completed (terminal)
    ↓           ↓           ↓
Cancelled   Cancelled   Cancelled  (any non-terminal state)
```

## Tier Progression

| Tier     | Min Lifetime Points | Multiplier | Benefits                   |
|----------|---------------------|------------|----------------------------|
| Bronze   | 0                   | 1×         | Welcome drink              |
| Silver   | 1,000               | 1.5×       | Priority seating           |
| Gold     | 5,000               | 2×         | Free dessert               |
| Platinum | 10,000              | 3×         | VIP access                 |
| Custom   | configurable        | config     | configurable               |

## Customer Segmentation

Segments are evaluated against profiles using criteria:

- **Visit Frequency**: VeryLow (<4/yr), Low (4-11/yr), Medium (12-23/yr), High (24-51/yr), VeryHigh (52+/yr)
- **Spending Level**: Based on average spend per visit
- **Engagement Level**: Based on recency of last visit
- **Preferences**: Cuisine, dietary restrictions
- **Tags**: Custom tags
- **Life events**: Birthday month, anniversary month

## Tests

```bash
npx vitest run src/modules/loyalty/tests
```

6 test files, 54 tests covering:
- Points engine (earn, redeem, bonus, adjustment, expiration, reversal, tier determination)
- Rewards (creation, availability, quantity limits, redemption limits)
- Redemption FSM (lifecycle, cancellation, validation, approval)
- Tier evaluation (upgrade detection, no-change, multi-tier progression)
- Segmentation (spending, frequency, cuisine, tags, birthday, engagement)
- Integration (full lifecycle: registration → earn → redeem, bonus/adjustment, segmentation, reversal)

## Events

| Event                | Payload                                                    |
|----------------------|------------------------------------------------------------|
| CustomerRegistered   | profileId, customerId, restaurantId, email, programId       |
| PointsEarned         | transactionId, accountId, points, balanceAfter, referenceId |
| PointsRedeemed       | transactionId, redemptionId, points, rewardId, balanceAfter |
| RewardCreated        | rewardId, programId, name, type, costInPoints               |
| RewardRedeemed       | redemptionId, rewardId, customerProfileId, pointsCost       |
| LoyaltyLevelChanged  | customerProfileId, previousTier, newTier, lifetimePoints   |

## Future Integrations

- Marketing provider integration (email/SMS campaigns based on segments)
- Payment rewards processing (direct point earning on transactions)
- External tier benefits (partner integrations)
- Advanced analytics and churn prediction
