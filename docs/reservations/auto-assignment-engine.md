# Auto Assignment Engine

## Architecture

The Auto Assignment Engine intelligently selects the optimal table for a reservation using a modular component architecture. Each component has a single responsibility and follows the Strategy and Coordinator patterns.

```
┌────────────────────────────────────────────────────────────────────┐
│                      AutoAssignmentEngine                          │
│                        (Orchestrator)                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  AssignmentCoordinator                        │  │
│  │  - assign(context)                                           │  │
│  │  - assignWithStrategy(context, strategy)                     │  │
│  │  - getCandidates(context)                                    │  │
│  └───────┬──────────────────────────────┬───────────────────────┘  │
│          │                              │                          │
│  ┌───────┴──────────────┐    ┌──────────┴──────────┐              │
│  │CandidateGenerator    │    │   AssignmentStrategy │              │
│  │- generate()          │    │   - select()         │              │
│  └───────┬──────────────┘    └──────────┬───────────┘              │
│          │                              │                          │
│  ┌───────┴──────────────┐    ┌──────────┴───────────┐             │
│  │  AvailabilityService │    │   ScoringEngine       │             │
│  │  (Port)              │    │   - score()           │             │
│  └──────────────────────┘    └──────────────────────┘             │
│                                                                    │
│  Dependencies:                                                     │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────┐     │
│  │Table         │  │TableGroup      │  │Reservation        │     │
│  │Repository    │  │Repository      │  │Repository         │     │
│  └──────────────┘  └────────────────┘  └───────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
```

## Components

### AutoAssignmentEngine (`engine/assignment/AutoAssignmentEngine.ts`)
Orchestrator. Creates and wires all sub-components. Exposes methods:
- `assign()` — Assigns the best table for a reservation
- `assignWithStrategy()` — Assigns using a custom strategy
- `getCandidates()` — Returns all candidate tables without selecting
- `withScoringFactors()` — Customizes scoring weights

### AssignmentCandidateGenerator (`engine/assignment/AssignmentCandidateGenerator.ts`)
Generates candidate tables and table groups:
1. Fetches active, reservable tables via `TableRepository`
2. Filters by capacity, dining area, accessibility, table type
3. Checks availability via `AvailabilityService` (port → `AvailabilityEngine`)
4. Detects overlapping reservations via `ReservationRepository`
5. Generates group candidates by checking member table availability
6. Returns all candidates with availability status

### AssignmentScoringEngine (`engine/assignment/AssignmentScoringEngine.ts`)
Scores candidates across 4 factors with configurable weights:

| Factor | Default Weight | Description |
|--------|---------------|-------------|
| Capacity Fit | 0.35 | How well party size matches table capacity (less waste = higher) |
| Availability Quality | 0.30 | Directly available (1.0), group available (0.3), unavailable (0) |
| Dining Area Fit | 0.15 | Matches preference (1.0), no preference (0.5), mismatch (0) |
| Table Utilization | 0.20 | Party-to-capacity ratio (1.0 at 100% utilization) |

### AssignmentStrategy (`engine/assignment/AssignmentStrategy.ts`)
Two built-in strategies:

**DefaultAssignmentStrategy** — Multi-factor scoring strategy:
- Scores all candidates using `AssignmentScoringEngine`
- Selects the candidate with the highest total score
- Falls back on capacity fit for tie-breaking

**BestFitAssignmentStrategy** — Minimal waste strategy:
- Filters to only available candidates
- Selects the candidate with the least wasted capacity
- Useful when capacity optimization is the primary goal

### AssignmentCoordinator (`engine/assignment/AssignmentCoordinator.ts`)
Coordinates the complete assignment workflow:
1. `assign()` — Generate candidates → Select best via default strategy
2. `assignWithStrategy()` — Generate candidates → Select via custom strategy
3. `getCandidates()` — Generate candidates only (no selection)

### AssignmentResult (`engine/assignment/AssignmentResult.ts`)
Result types:
- `assigned(tableId, score?, metadata?)` — Successful single-table assignment
- `assignedGroup(tableGroupId, score?, metadata?)` — Successful group assignment
- `notAssigned(reason, metadata?)` — No suitable table found

Status values: `"assigned"`, `"not_assigned"`

## Scoring Formula

```
totalScore = capacityFit × 0.35 + availabilityQuality × 0.30
           + diningAreaFit × 0.15 + utilizationScore × 0.20
```

### Capacity Fit
```
if partySize > maxCapacity → 0
if partySize < minCapacity → 0
score = 1.0 - (maxCapacity - partySize) / (maxCapacity - minCapacity)
```
Perfect fit = 1.0 when party size equals max capacity.

### Availability Quality
| Condition | Score |
|-----------|-------|
| Directly available | 1.0 |
| Group but unavailable | 0.3 |
| Otherwise | 0.0 |

### Dining Area Fit
| Condition | Score |
|-----------|-------|
| Matches preference | 1.0 |
| No preference | 0.5 |
| Mismatch | 0.0 |

### Utilization Score
| Utilization Ratio | Score |
|-----------------|-------|
| 1.0 (full) | 1.0 |
| 0.7 – 1.0 | ratio |
| 0.5 – 0.7 | 0.6 |
| 0.3 – 0.5 | 0.3 |
| < 0.3 | 0.1 |

## Future Strategy Support

The `AssignmentStrategy` interface is designed for extension:

```typescript
export interface AssignmentStrategy {
  readonly name: string;
  select(candidates: AssignmentCandidate[], context: AssignmentContext): AssignmentResult;
}
```

### Future Strategies

**Revenue Optimization Strategy:**
- Prioritize tables with higher minimum spend or revenue potential
- Factor in historical revenue per table
- Consider turn time for maximizing seat turnover

**VIP Assignment Strategy:**
- Auto-detect VIP customers and assign premium tables
- Check VIP tier via loyalty system
- Prefer window/private dining areas

**Loyalty Assignment Strategy:**
- Assign better tables based on loyalty tier
- Factor in visit frequency and rating
- Consider customer preferences from profile

**AI Assignment Strategy:**
- ML model predicts optimal assignment
- Learns from historical seating patterns
- Real-time optimization across multiple objectives
- Dynamic weight adjustment per restaurant

**Restaurant Custom Strategy:**
- Per-restaurant custom assignment rules
- DSL-defined strategies
- A/B testing framework for strategy comparison

## Dependency Injection

```typescript
import { AutoAssignmentEngine } from "./engine/assignment/index.js";

const engine = new AutoAssignmentEngine({
  availabilityService,    // AvailabilityService port
  tableRepository,        // TableRepository
  tableGroupRepository,   // TableGroupRepository
  reservationRepository,  // ReservationRepository
});

// Use default strategy
const result = await engine.assign({
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
});

if (result.status === "assigned") {
  // Create reservation with result.tableId
}

// Use custom strategy
import { BestFitAssignmentStrategy } from "./engine/assignment/index.js";

const bestFit = new BestFitAssignmentStrategy(engine.getScoringEngine());
const result = await engine.assignWithStrategy(context, bestFit);

// Use custom scoring factors
engine.withScoringFactors({
  capacityFitWeight: 0.5,
  availabilityWeight: 0.3,
  diningAreaWeight: 0.1,
  utilizationWeight: 0.1,
});
```

## Quality Attributes

- **DDD**: Each component has a single domain responsibility
- **SOLID**: Single Responsibility, Open/Closed, Dependency Inversion
- **Strategy Pattern**: `AssignmentStrategy` interface with multiple implementations
- **Coordinator Pattern**: `AssignmentCoordinator` orchestrates generator + strategy
- **No `any` types**: Strict TypeScript throughout
- **No duplicated business rules**: Reuses `AvailabilityService`, `ReservationTimeRange`, `TableCapacity`
- **Dependency Inversion**: Depends on `AvailabilityService` port, not concrete engine
