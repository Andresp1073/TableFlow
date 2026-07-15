# Enterprise Kitchen Display System

## Architecture

The Kitchen Display System (KDS) is an independent bounded context within TableFlow,
designed to manage kitchen operations, ticket workflows, station assignment, and
preparation tracking following Clean Architecture and DDD principles.

```
┌─────────────────────────────────────────────────────┐
│                 Application Layer                    │
│        KitchenManager                                │
├─────────────────────────────────────────────────────┤
│                  Domain Layer                        │
│   KitchenTicket   KitchenStation   KitchenOrder     │
│   PreparationTask  KitchenPriority                  │
│   PriorityEngine   StationAssignmentService         │
│   SLATracker                                        │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                   │
│   InMemoryKitchenTicketRepository                   │
│   InMemoryKitchenStationRepository                  │
└─────────────────────────────────────────────────────┘
```

## Restaurant → Kitchen Domain Model

```
Restaurant
    │
    └── Kitchen (1 per restaurant)
            │
            ├── KitchenStation: Grill
            ├── KitchenStation: Bar
            ├── KitchenStation: Dessert
            ├── KitchenStation: Cold
            ├── KitchenStation: Preparation
            └── KitchenStation: Custom
                    │
                    └── KitchenTicket (per order)
                            │
                            └── PreparationTask (per menu item)
```

## Ticket Lifecycle

```
New → Accepted → Preparing → Ready → Delivered
  ↘                  ↘
   Cancelled         Cancelled
```

| Status    | Description                            |
|-----------|----------------------------------------|
| New       | Ticket created, awaiting acceptance    |
| Accepted  | Station accepted the ticket            |
| Preparing | Chef started working on the ticket     |
| Ready     | All items completed, ready for service |
| Delivered | Food delivered to table                |
| Cancelled | Ticket cancelled                       |

### Task Lifecycle (per menu item)

```
Pending → InProgress → Completed
                     → Skipped
```

## Station Model

### Default Station Types

| Type       | Description              |
|------------|--------------------------|
| Grill      | Steaks, burgers, grill   |
| Bar        | Drinks, cocktails        |
| Dessert    | Desserts, pastries       |
| Cold       | Salads, appetizers       |
| Preparation| Prep station             |
| Custom     | User-defined station     |

### Station Capacity
- Each station has `maxConcurrentTickets` limit
- Ticket count is tracked in real-time
- Stations can be Active, Inactive, Paused, or Closed

## Priority Engine

### Priority Levels

| Level  | Weight | SLA Target |
|--------|--------|------------|
| Normal | 0      | 10 min     |
| High   | 25     | 7.5 min    |
| Urgent | 50     | 5 min      |
| VIP    | 75     | 3 min      |
| Delayed| Auto   | 5 min      |

### Scoring Formula
```
score = (priorityWeight * 25)
      + (waitingTime / slaThreshold) * 100 * 0.3
      + (isDelayed ? 50 : 0)
```

### Features
- FIFO ordering within same priority level
- Automatic escalation to Delayed when SLA breached
- Configurable SLA thresholds per priority

## Workflow

### Ticket Creation
1. Order arrives from POS or other source
2. Items are split into tasks by station type
3. Ticket is assigned to appropriate station
4. Station capacity is checked before assignment

### Preparation Flow
1. Ticket appears in station queue (New)
2. Chef accepts ticket (Accepted)
3. Chef starts preparation (Preparing)
4. Individual items are marked complete
5. When all items done, ticket moves to Ready
6. Server delivers food (Delivered)

### Cancellation
- Cancellation releases station capacity
- Reason is recorded for audit

## Time Management

### SLA Tracking
- Each priority level has configurable SLA targets
- Tickets are monitored for SLA compliance
- Warning at 80% of SLA threshold
- Delayed at 100% of SLA threshold
- Summary metrics: onTrack, warning, delayed, complianceRate

### Timing Metrics
- Waiting time: time from creation to start
- Preparation time: time from start to completion
- Total time: time from creation to completion
- SLA breach detection with configurable thresholds

## Events

| Event                  | Trigger                | Payload                               |
|------------------------|------------------------|---------------------------------------|
| KitchenTicketCreated   | Ticket created         | ticketId, stationId, priority, items  |
| KitchenTicketStarted   | Preparation started    | ticketId, stationId, waitingTimeMs    |
| KitchenTicketCompleted | All items done         | ticketId, totalTimeMs, prepTimeMs     |
| KitchenTicketDelayed   | SLA breached           | ticketId, delayMs, slaMs              |
| KitchenTicketCancelled | Ticket cancelled       | ticketId, reason                      |

## Station Assignment

### Assignment Strategy
1. **Preferred station**: Try exact match first
2. **Least loaded station**: Assign to station with lowest load ratio
3. **Item type mapping**: Map menu items to station types automatically

### Item-to-Station Mapping
```
grill/steak/burger → Grill
cocktail/beer/wine → Bar
dessert/cake       → Dessert
salad/appetizer    → Cold
default            → Preparation
```

## Dependencies

| Dependency          | Usage                          |
|---------------------|--------------------------------|
| POS Integration     | Order and menu data            |
| Event Bus           | Domain event publishing        |
| Observability       | Performance monitoring         |
| Scheduler           | SLA check scheduling           |
| Feature Flags       | KDS feature toggles            |
| Configuration Center| Station and SLA configuration  |

## Testing

```bash
# Run all kitchen tests
npx vitest run src/modules/kitchen/tests/
```

### Test Coverage
- Ticket lifecycle (full transition sequence)
- Station creation and capacity management
- Priority engine scoring and ordering
- SLA tracking and breach detection
- Station assignment algorithms
- Task lifecycle (start, complete, skip)
- Complete integration scenarios
- Capacity overflow protection
