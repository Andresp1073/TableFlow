# Reservation Calendar Engine

## Architecture

The Reservation Calendar Engine provides read-only data projections of reservation data across daily, weekly, timeline, occupancy, availability, and conflict views. Each view is built by a dedicated component following the Builder pattern.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       ReservationCalendarEngine                             │
│                            (Orchestrator)                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐          │
│  │ CalendarDay    │  │ CalendarWeek   │  │ CalendarTimeline  │          │
│  │ Builder        │  │ Builder        │  │ Builder           │          │
│  └────────┬───────┘  └────────┬───────┘  └─────────┬──────────┘          │
│           │                   │                     │                      │
│  ┌────────┴─────────────────────────────────────────┴──────────┐          │
│  │                  Calendar Data Layer                          │          │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │          │
│  │  │Occupancy       │  │Availability    │  │Conflict       │  │          │
│  │  │Calculator      │  │Calculator      │  │Aggregator     │  │          │
│  │  └────────┬───────┘  └────────┬───────┘  └───────┬───────┘  │          │
│  └───────────┼────────────────────┼───────────────────┼──────────┘          │
│              │                    │                   │                      │
│  ┌───────────┴────────────────────┴───────────────────┴──────────┐          │
│  │                    Dependencies                                 │          │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │          │
│  │  │Reservation     │  │Table           │  │Conflict        │  │          │
│  │  │Repository      │  │Repository      │  │Pipeline        │  │          │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │          │
│  └────────────────────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────────────────┘
```

## Components

### ReservationCalendarEngine (`engine/calendar/ReservationCalendarEngine.ts`)
Orchestrator. Creates and wires all sub-components. Exposes 6 view methods:
- `getDayView()` — Complete daily reservation view
- `getWeekView()` — 7-day weekly summary
- `getTimelineView()` — Chronological 24-hour timeline
- `getOccupancyView()` — Occupancy metrics
- `getAvailabilityView()` — Availability metrics
- `getConflictView()` — Aggregated conflict report

### CalendarDayBuilder (`engine/calendar/CalendarDayBuilder.ts`)
Builds a complete daily view by composing occupancy, availability, and conflict results. Converts `Reservation` domain objects to lightweight `CalendarReservationSummary` objects.

### CalendarWeekBuilder (`engine/calendar/CalendarWeekBuilder.ts`)
Builds a 7-day week view by iterating over each day. Delegates to `CalendarDayBuilder` for each day's data. Calculates a `WeeklySummary` with:
- Total reservations and guests
- Average party size
- Average occupancy rate
- Total and blocking conflict counts

### CalendarTimelineBuilder (`engine/calendar/CalendarTimelineBuilder.ts`)
Builds a chronological 24-hour timeline broken into hourly slots. For each hour, shows:
- Reservations active during that hour
- Available table count
- Occupied table count

### CalendarOccupancyCalculator (`engine/calendar/CalendarOccupancyCalculator.ts`)
Calculates occupancy metrics:
- Total tables and total capacity
- Active reservations count and capacity used
- Occupancy rate (occupied tables / total tables)
- Capacity rate (occupied capacity / total capacity)
- Peak occupancy hour (hour with most overlapping reservations)
- 24-hour hourly breakdown with per-hour occupancy

### CalendarAvailabilityCalculator (`engine/calendar/CalendarAvailabilityCalculator.ts`)
Calculates availability metrics:
- Total tables and total capacity
- Available tables (total minus uniquely reserved)
- Maximum available capacity
- 24-hour time slot availability
- Fully booked detection

Does NOT call `AvailabilityService` directly — it computes availability from reservation overlap data and table data. This avoids redundant calls to the Availability Engine for bulk calendar queries.

### CalendarConflictAggregator (`engine/calendar/CalendarConflictAggregator.ts`)
Aggregates conflicts detected by the `ReservationConflictPipeline`:
- Iterates over all active reservations for a date
- Runs the conflict pipeline (`evaluateAll()`) for each reservation
- Deduplicates conflicts by code + rule combination
- Categorizes by severity (blocking, warning, info)
- Tracks which reservations triggered each conflict

## Calendar Views

### Daily View
```typescript
CalendarDayView {
  date: Date;
  restaurantId: string;
  reservations: CalendarReservationSummary[];  // Lightweight reservation list
  occupancy: OccupancyView;                     // Occupancy metrics
  availability: CalendarAvailabilityView;       // Availability metrics
  conflicts: CalendarConflictView;              // Aggregated conflicts
}
```

### Weekly View
```typescript
CalendarWeekView {
  startDate: Date;
  endDate: Date;
  restaurantId: string;
  days: CalendarDayView[];       // 7 day views
  summary: WeeklySummary;         // Aggregated metrics
}
```

### Timeline View
```typescript
CalendarTimelineView {
  date: Date;
  restaurantId: string;
  slots: CalendarTimelineSlot[];  // 24 hourly slots
  reservations: CalendarReservationSummary[];  // All reservations
}
```

### Occupancy View
```typescript
OccupancyView {
  totalTables: number;
  totalCapacity: number;
  occupiedTables: number;
  occupiedCapacity: number;
  occupancyRate: number;        // Percentage
  capacityRate: number;         // Percentage
  peakOccupancyHour: number | null;
  hourlyBreakdown: HourlyOccupancy[];  // 24 entries
}
```

### Availability View
```typescript
CalendarAvailabilityView {
  totalTables: number;
  totalCapacity: number;
  availableTables: number;
  maxAvailableCapacity: number;
  isFullyBooked: boolean;
  timeSlots: TimeSlotAvailability[];  // 24 hourly slots
}
```

### Conflict View
```typescript
CalendarConflictView {
  totalConflicts: number;
  blockingConflicts: number;
  warningConflicts: number;
  infoConflicts: number;
  conflicts: AggregatedConflict[];  // Deduplicated by code+rule
}
```

## Key Design Decisions

### No Direct AvailabilityService Calls
The availability calculator computes availability from reservation overlap logic rather than calling the Availability Engine. This is intentional:
- Bulk calendar queries would make hundreds of `checkAvailability()` calls
- The overlap approach is O(n × m) where n=24 slots and m=active reservations
- The Availability Engine is still used for individual reservation checks (via the conflict pipeline)

### UTC-Based Time Slots
All hourly slot calculations use UTC to ensure consistency regardless of server timezone. This matches the convention used by `ReservationTimeRange` which stores UTC timestamps.

### Short-Circuit Avoidance for Conflicts
The conflict aggregator uses `evaluateAll()` instead of `evaluate()` to ensure all rules are evaluated even if a blocking conflict is found. This provides a complete picture of all conflicts for the calendar view.

## Future Extension Points

### Monthly View
- `CalendarMonthBuilder` iterating over 28-31 days
- Monthly summary with peak day detection
- Heatmap data generation

### Heatmaps
- Peak hour/table type occupancy heatmap data
- Day-of-week occupancy patterns
- Seasonal trend data

### Drag & Drop
- `CalendarDragDropHandler` for rescheduling via UI
- Validation pipeline for drop targets
- Integration with `ReservationUpdater`

### Calendar Sync (Google, Outlook)
- `CalendarSyncService` to convert calendar views to external formats
- iCal/JSON feed generation
- Two-way sync handlers

### AI Predictions
- Predicted occupancy based on historical patterns
- Recommended staffing levels
- Demand forecasting per time slot

## Usage

```typescript
import { ReservationCalendarEngine } from "./engine/calendar/index.js";
import { ReservationConflictPipeline } from "./engine/conflict-pipeline/index.js";

const engine = new ReservationCalendarEngine({
  reservationRepository,
  tableRepository,
  conflictPipeline,  // Pre-configured ReservationConflictPipeline
});

// Daily view
const dayView = await engine.getDayView({
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
});

console.log(dayView.occupancy.occupancyRate);  // 50
console.log(dayView.availability.availableTables);  // 3
console.log(dayView.conflicts.totalConflicts);  // 2

// Weekly view
const weekView = await engine.getWeekView({
  restaurantId: "rest-1",
  startDate: new Date("2026-07-13"),
});

console.log(weekView.summary.totalReservations);  // 15
console.log(weekView.summary.averageOccupancyRate);  // 42.5

// Timeline view
const timeline = await engine.getTimelineView({
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
});

timeline.slots.forEach((slot) => {
  console.log(`${slot.time.label}: ${slot.occupiedCount} occupied, ${slot.availableCount} available`);
});
```

## Quality Attributes

- **DDD**: Each component has a single domain responsibility
- **SOLID**: Single Responsibility, Open/Closed, Dependency Inversion
- **Builder Pattern**: Day, Week, and Timeline builders construct complex views
- **No duplicated business rules**: Reuses `ReservationStatus.isActive()`, `ReservationTimeRange`, conflict pipeline
- **Read-only**: Calendar engine does not modify any state
- **UTC-based**: All time slot calculations use UTC for reproducibility
