# Waitlist Engine

## Architecture

The Waitlist Engine manages restaurant waitlists using a modular component architecture. Each component has a single responsibility and follows the Strategy and Coordinator patterns.

```
┌──────────────────────────────────────────────────────────────┐
│                      WaitlistEngine                          │
│                       (Orchestrator)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  WaitlistManager │  │ PromotionCoord.  │                  │
│  │  - add/remove    │  │  - promoteNext   │                  │
│  │  - cancel/expire │  │  - prepare       │                  │
│  │  - getPosition   │  │  - findCandidates│                  │
│  └───────┬──────────┘  └───────┬──────────┘                  │
│          │                     │                             │
│  ┌───────┴─────────────────────┴──────────┐                  │
│  │      CandidateSelector                 │                  │
│  │  - selectBestCandidate                 │                  │
│  │  - findCandidatesForTimeSlot           │                  │
│  └───────┬────────────────────┬───────────┘                  │
│          │                    │                              │
│  ┌───────┴──────────┐  ┌─────┴─────────────┐                │
│  │PriorityCalculator│  │EligibilityPolicy  │                │
│  │- waiting time    │  │- canAddToWaitlist │                │
│  │- party size      │  │- isEligibleFor... │                │
│  │- source          │  │- canExtendWaitlist│                │
│  └──────────────────┘  └───────────────────┘                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               WaitlistRepository                      │   │
│  │               (Interface)                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Dependencies:                                                │
│  ┌──────────────┐  ┌────────────────┐                       │
│  │Availability  │  │ Reservation    │                       │
│  │Service       │  │ Source (VO)    │                       │
│  └──────────────┘  └────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

## Components

### WaitlistEngine (`engine/waitlist/WaitlistEngine.ts`)
Orchestrator. Creates and wires all sub-components. Exposes methods:
- `addToWaitlist()` — Adds a new waitlist entry
- `updateWaitlist()` — Updates an existing entry
- `removeFromWaitlist()` — Removes an entry
- `cancelWaitlist()` — Cancels an entry
- `promoteNext()` — Promotes the best candidate
- `getWaitlist()` — Lists all entries
- `getActiveWaitlist()` — Lists active entries only
- `getPosition()` — Returns the position of an entry
- `findNextCandidates()` — Finds top N candidates
- `getWaitlistCount()` — Returns total count

### WaitlistStatus (`engine/waitlist/WaitlistStatus.ts`)
Value object with states:
- `waiting` → `eligible`, `expired`, `cancelled`
- `eligible` → `promoted`, `expired`, `cancelled`
- `promoted` — terminal
- `expired` — terminal
- `cancelled` — terminal

### WaitlistEntry (`engine/waitlist/WaitlistEntry.ts`)
Domain interface with fields: id, restaurantId, reservationId, customerId, partySize, source, requestedDate, requestedStartTime, requestedEndTime, status, priority, notes, timestamps.

### WaitlistRepository (`engine/waitlist/WaitlistRepository.ts`)
Repository interface with methods: save, update, findById, findByIdAndRestaurant, findByRestaurantId, findByStatus, findByFilters, remove, countByRestaurant.

### WaitlistManager (`engine/waitlist/WaitlistManager.ts`)
Handles CRUD operations:
- `addToWaitlist()` — Validates eligibility, creates entry with computed priority
- `updateWaitlist()` — Updates fields, recalculates priority
- `removeFromWaitlist()` — Hard deletes
- `cancelWaitlist()` — Soft cancel with status transition
- `expireWaitlist()` — Marks as expired with timestamp
- `markEligible()` — Transitions waiting → eligible
- `getActiveWaitlist()` — Filters active entries
- `getPosition()` — Computes position by sorting by priority

### WaitlistPriorityCalculator (`engine/waitlist/WaitlistPriorityCalculator.ts`)
Strategy for computing priority scores:
- **Waiting time weight** (default 0.5): Longer wait = higher score (capped at 120 min = 1.0)
- **Party size weight** (default 0.3): Smaller parties score higher (4+ = 0.8, 2 = 1.0)
- **Source weight** (default 0.2): walk_in=1.0, phone=0.8, website/mobile=0.6, admin=0.4, api=0.3

Configurable via constructor `PriorityFactors`. Supports `withFactors()` for immutable updates.

### WaitlistCandidateSelector (`engine/waitlist/WaitlistCandidateSelector.ts`)
Selects the best candidate for promotion:
1. Filters eligible entries via `WaitlistEligibilityPolicy`
2. Sorts by priority (descending)
3. Checks availability for each candidate in order
4. Returns the first candidate with available capacity

### WaitlistPromotionCoordinator (`engine/waitlist/WaitlistPromotionCoordinator.ts`)
Coordinates the promotion workflow:
- `promoteNext()` — Finds and promotes best candidate, updates status to `promoted`
- `preparePromotion()` — Marks entry as `eligible` for later promotion
- `findNextCandidates()` — Returns top N candidates sorted by priority

Does NOT send notifications — only prepares the promotion workflow.

### WaitlistEligibilityPolicy (`engine/waitlist/WaitlistEligibilityPolicy.ts`)
Validates eligibility:
- `canAddToWaitlist()` — Validates party size, time range, past time
- `isEligibleForPromotion()` — Checks active status, future time slot
- `canExtendWaitlist()` — Checks terminal status, future extension

## Priority Calculation

```
score = waitingTime × 0.5 + partySize × 0.3 + sourceScore × 0.2
```

### Waiting Time Score
```
waitingTime = min(elapsedMinutes / 120, 1.0)
```
Capped at 120 minutes (2 hours).

### Party Size Score
| Party Size | Score |
|-----------|-------|
| 1-3       | 1.0   |
| 4-5       | 0.8   |
| 6-7       | 0.6   |
| 8+        | 0.4   |

### Source Score
| Source | Score |
|--------|-------|
| walk_in | 1.0 |
| phone | 0.8 |
| website | 0.6 |
| mobile_app | 0.6 |
| admin_panel | 0.4 |
| api | 0.3 |

## Promotion Workflow

```
1. Customer added → status: waiting (priority computed)
2. Staff/system marks → status: eligible
3. PromotionCoordinator.promoteNext():
   a. Find all waiting entries
   b. Filter eligible
   c. Sort by priority (descending)
   d. For each candidate, check availability
   e. First available → status: promoted
   f. Return promotion result
4. External handler can now create reservation from promoted entry
```

## Extension Points

### VIP/Loyalty Priority
Extend `WaitlistPriorityCalculator` with a VIP factor:
```typescript
class VIPPriorityCalculator extends WaitlistPriorityCalculator {
  calculate(entry: WaitlistEntry): PriorityScore {
    const base = super.calculate(entry);
    if (entry.customerId && isVIP(entry.customerId)) {
      return { ...base, score: Math.min(base.score * 1.3, 1) };
    }
    return base;
  }
}
```

### AI Ranking
Replace `WaitlistPriorityCalculator` with an AI-based implementation:
```typescript
class AIPriorityCalculator implements PriorityCalculator {
  async calculate(entry: WaitlistEntry): Promise<PriorityScore> {
    // Call ML service for dynamic priority
  }
}
```

### Restaurant Custom Policies
Add custom rules to `WaitlistEligibilityPolicy`:
- Maximum waitlist duration per restaurant
- Blackout times for certain party sizes
- Source-based restrictions

### Dynamic Priority Factors
Use `PriorityFactors` configuration per restaurant:
- Store factor weights as restaurant settings
- Create calculator instance per restaurant with custom weights

## Usage

```typescript
import { WaitlistEngine } from "./engine/waitlist/index.js";
import { ReservationSource } from "./domain/models/ReservationSource.js";

const engine = new WaitlistEngine({
  repository: waitlistRepository,
  availabilityService: availabilityService,
});

// Add to waitlist
const entry = await engine.addToWaitlist({
  restaurantId: "rest-1",
  customerId: "cust-1",
  partySize: 4,
  source: ReservationSource.create("website"),
  requestedDate: new Date("2026-07-14"),
  requestedStartTime: new Date("2026-07-14T18:00:00Z"),
  requestedEndTime: new Date("2026-07-14T20:00:00Z"),
});

// Promote next candidate
const result = await engine.promoteNext("rest-1");
if (result.promoted) {
  // Create reservation from result.entry
}

// Get position
const position = await engine.getPosition(entry.id, "rest-1");
```

## Quality Attributes

- **DDD**: Each component has a single domain responsibility
- **SOLID**: Single Responsibility, Open/Closed, Dependency Inversion
- **Strategy Pattern**: Priority calculation, eligibility policy, candidate selection
- **Coordinator Pattern**: Promotion coordinator orchestrates the workflow
- **No `any` types**: Strict TypeScript throughout
- **No duplicated business rules**: Reuses existing value objects and services
- **No notifications**: Promotion only prepares the workflow, does not send messages
