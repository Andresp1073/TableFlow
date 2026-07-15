# Enterprise Revenue Management Platform — Phase 14.6

## Overview

The Enterprise Revenue Management Platform is an independent bounded context within TableFlow, following Domain-Driven Design and Clean Architecture. It provides demand analysis, capacity management, pricing rules, occupancy forecasting, and optimization recommendations without external pricing provider dependencies.

## Architecture

```
modules/revenue/
├── domain/
│   ├── models/                          # Aggregate roots & value objects
│   │   ├── RestaurantCapacity.ts        (# dining areas, time slot capacity, table config)
│   │   ├── DemandSnapshot.ts            (# historical demand, occupancy, revenue)
│   │   ├── RevenueStrategy.ts           (# 8 strategy types, conditions, status FSM)
│   │   ├── PricingRule.ts               (# conditions, priority, applicability, daily cap)
│   │   ├── OccupancyForecast.ts         (# predicted occupancy, confidence bounds)
│   │   ├── RevenueMetric.ts             (# KPIs: avg check, revPAR, table turns)
│   │   └── OptimizationRecommendation.ts (# 7 recommendation types, apply/dismiss)
│   ├── events/                          # 5 domain events
│   ├── repositories/                    # Interfaces: DemandSnapshot, RevenueStrategy, Capacity, Analytics
│   └── services/                        # DemandAnalyzer, CapacityAnalyzer, PricingEngine, ForecastService, OptimizationEngine
├── application/
│   ├── services/                        # RevenueManager
│   └── dtos/                            # DemandSnapshotDto, RevenueStrategyDto, RevenueMetricDto
├── infrastructure/
│   └── repositories/                    # In-memory implementations
├── errors/                              # PricingRuleError, DemandAnalysisError, RevenueStrategyError
└── tests/                               # 6 test files, 37 tests
```

## Demand Analysis

The `DemandAnalyzer` processes historical snapshots to produce:
- **DemandSummary**: aggregates reservations, walk-ins, turnaways, occupancy by time slot
- **Peak/Low Detection**: identifies highest and lowest occupancy periods
- **Opportunities**: low-occupancy slots with potential cover recovery
- **Trend Detection**: increasing / decreasing / stable based on trailing 7-day comparison

## Capacity Management

The `CapacityAnalyzer` evaluates:
- Active dining area capacity and utilization
- Estimated table turns per time slot
- Unused capacity detection (flags >30% unused)
- Party accommodation feasibility (size limits, availability)

## Pricing Engine

Pricing rules support multiple conditions evaluated at runtime:

| Condition      | Description                        |
|----------------|------------------------------------|
| dayOfWeek      | Applicable days (0-6)              |
| timeSlot       | Applicable time slots              |
| min/maxOccupancy | Occupancy rate range             |
| min/maxPartySize | Party size range                |
| leadTimeHours  | Booking lead time window           |
| isHoliday      | Holiday flag                       |
| specialEvent   | Event name match                   |

Rules are sorted by priority; the highest-priority matching rule applies first.

## Forecast Service

Generates occupancy forecasts with confidence levels based on historical data volume:
- **30+ records**: High confidence
- **14-29 records**: Medium confidence
- **7-13 records**: Low confidence
- **<7 records**: Very Low confidence

Forecasts include lower/upper bounds calculated from historical variance and factor attribution.

## Optimization Engine

Generates actionable recommendations across 7 types:
1. **IncreaseAvailability** – high occupancy periods need more capacity
2. **AdjustPricing** – price modifications for demand balancing
3. **PromoteLowDemand** – marketing for underperforming slots
4. **OptimizeTableAllocation** – improve table turn efficiency
5. **ReduceEmptyCapacity** – fill unused seats
6. **ExtendHours** – extend operating hours for high demand
7. **ModifyPartySizePolicy** – adjust party size restrictions

## Events

| Event                      | Payload                                               |
|----------------------------|-------------------------------------------------------|
| DemandAnalyzed             | snapshotId, restaurantId, date, timeSlot, occupancy   |
| RevenueOpportunityDetected | restaurantId, timeSlot, opportunityType, revenueGain  |
| PricingRuleCreated         | ruleId, restaurantId, conditions, multiplier, priority |
| ForecastGenerated          | forecastId, restaurantId, date, predictedOccupancy     |
| OptimizationRecommended    | recommendationId, type, priority, revenueImpact        |

## Tests

```bash
npx vitest run src/modules/revenue/tests
```

6 test files, 37 tests covering demand analysis, pricing rules, capacity, forecasts, optimization, and integration.

## Future AI Integration

- Machine learning occupancy prediction models
- Dynamic price optimization algorithms
- Automated recommendation application
- Real-time demand sensing
- Predictive churn and revenue forecasting
