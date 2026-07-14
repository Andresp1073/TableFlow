import { describe, it, expect, vi, beforeEach } from "vitest";
import { CalendarDayBuilder } from "../../../engine/calendar/CalendarDayBuilder.js";
import { CalendarWeekBuilder } from "../../../engine/calendar/CalendarWeekBuilder.js";
import { CalendarTimelineBuilder } from "../../../engine/calendar/CalendarTimelineBuilder.js";
import { CalendarOccupancyCalculator } from "../../../engine/calendar/CalendarOccupancyCalculator.js";
import { CalendarAvailabilityCalculator } from "../../../engine/calendar/CalendarAvailabilityCalculator.js";
import { CalendarConflictAggregator } from "../../../engine/calendar/CalendarConflictAggregator.js";
import { ReservationConflictPipeline } from "../../../engine/conflict-pipeline/ReservationConflictPipeline.js";
import { noConflict } from "../../../engine/conflict-pipeline/ConflictResult.js";
import { TableCapacity } from "../../../../tables/domain/models/TableCapacity.js";
import { ReservationDate } from "../../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationStatus } from "../../../domain/models/ReservationStatus.js";

function createMockTable(id: string, maxCapacity: number = 4) {
  return {
    id,
    restaurantId: "rest-1",
    branchId: "branch-1",
    diningAreaId: "area-1",
    tableTypeId: "type-1",
    tableNumber: { value: `T${id}` },
    name: { value: `Table ${id}` },
    description: null,
    minimumCapacity: TableCapacity.reconstitute(1),
    maximumCapacity: TableCapacity.reconstitute(maxCapacity),
    currentCapacity: TableCapacity.reconstitute(maxCapacity),
    shape: "round",
    width: 100,
    height: 100,
    position: null,
    rotation: null,
    qrIdentifier: null,
    isReservable: true,
    isAccessible: false,
    isActive: true,
    status: { value: "available" },
    metadata: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
  };
}

function createMockReservation(id: string, startHour: number = 18, endHour: number = 20, status: string = "confirmed") {
  const date = new Date("2026-07-14");
  return {
    id,
    restaurantId: "rest-1",
    reservationNumber: { value: `RES-${id}` },
    customerId: "cust-1",
    tableId: "table-1",
    tableGroupId: null,
    date: ReservationDate.create(date),
    timeRange: ReservationTimeRange.create(
      new Date(`2026-07-14T${startHour.toString().padStart(2, "0")}:00:00Z`),
      new Date(`2026-07-14T${endHour.toString().padStart(2, "0")}:00:00Z`),
    ),
    partySize: PartySize.create(4),
    status: ReservationStatus.create(status),
    source: { value: "website" },
    notes: null,
    specialRequests: null,
    createdBy: "user-1",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    cancelledAt: null,
  };
}

const date = new Date("2026-07-14");

describe("CalendarDayBuilder", () => {
  let pipeline: ReservationConflictPipeline;

  beforeEach(() => {
    pipeline = new ReservationConflictPipeline([
      { name: "pass", evaluate: async () => noConflict() },
    ]);
  });

  it("builds a complete day view with all sub-views", async () => {
    const occupancyCalc = new CalendarOccupancyCalculator();
    const availabilityCalc = new CalendarAvailabilityCalculator();
    const conflictAgg = new CalendarConflictAggregator(pipeline);
    const builder = new CalendarDayBuilder(occupancyCalc, availabilityCalc, conflictAgg);
    const tables = [createMockTable("t1")];
    const reservations = [createMockReservation("r1")];

    const result = await builder.build(date, "rest-1", reservations, tables);

    expect(result.date).toEqual(date);
    expect(result.restaurantId).toBe("rest-1");
    expect(result.reservations).toHaveLength(1);
    expect(result.reservations[0]?.id).toBe("r1");
    expect(result.reservations[0]?.reservationNumber).toBe("RES-r1");
    expect(result.reservations[0]?.partySize).toBe(4);
    expect(result.reservations[0]?.status).toBe("confirmed");
    expect(result.occupancy).toBeDefined();
    expect(result.availability).toBeDefined();
    expect(result.conflicts).toBeDefined();
  });

  it("builds day view with empty data", async () => {
    const occupancyCalc = new CalendarOccupancyCalculator();
    const availabilityCalc = new CalendarAvailabilityCalculator();
    const conflictAgg = new CalendarConflictAggregator(pipeline);
    const builder = new CalendarDayBuilder(occupancyCalc, availabilityCalc, conflictAgg);

    const result = await builder.build(date, "rest-1", [], []);

    expect(result.reservations).toHaveLength(0);
    expect(result.occupancy.totalTables).toBe(0);
    expect(result.occupancy.occupiedTables).toBe(0);
  });

  it("converts reservations to summaries correctly", () => {
    const occupancyCalc = new CalendarOccupancyCalculator();
    const availabilityCalc = new CalendarAvailabilityCalculator();
    const conflictAgg = new CalendarConflictAggregator(
      new ReservationConflictPipeline([]),
    );
    const builder = new CalendarDayBuilder(occupancyCalc, availabilityCalc, conflictAgg);
    const reservations = [createMockReservation("r1"), createMockReservation("r2")];

    const summaries = builder.toSummaries(reservations);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.id).toBe("r1");
    expect(summaries[1]?.id).toBe("r2");
    expect(summaries[0]?.source).toBe("website");
  });

  it("handles reservations with null fields", () => {
    const occupancyCalc = new CalendarOccupancyCalculator();
    const availabilityCalc = new CalendarAvailabilityCalculator();
    const conflictAgg = new CalendarConflictAggregator(
      new ReservationConflictPipeline([]),
    );
    const builder = new CalendarDayBuilder(occupancyCalc, availabilityCalc, conflictAgg);
    const res = {
      ...createMockReservation("r1"),
      customerId: null,
      tableId: null,
      tableGroupId: null,
      notes: null,
    };

    const summaries = builder.toSummaries([res]);

    expect(summaries[0]?.customerId).toBeNull();
    expect(summaries[0]?.tableId).toBeNull();
    expect(summaries[0]?.notes).toBeNull();
  });
});

describe("CalendarWeekBuilder", () => {
  let pipeline: ReservationConflictPipeline;

  beforeEach(() => {
    pipeline = new ReservationConflictPipeline([
      { name: "pass", evaluate: async () => noConflict() },
    ]);
  });

  it("builds a 7-day week view", async () => {
    const occupancyCalc = new CalendarOccupancyCalculator();
    const availabilityCalc = new CalendarAvailabilityCalculator();
    const conflictAgg = new CalendarConflictAggregator(pipeline);
    const dayBuilder = new CalendarDayBuilder(occupancyCalc, availabilityCalc, conflictAgg);
    const weekBuilder = new CalendarWeekBuilder(dayBuilder);

    const startDate = new Date("2026-07-13");
    const reservationsByDate = new Map<string, any[]>();
    const tablesByDate = new Map<string, any[]>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0] ?? "";
      reservationsByDate.set(key, i === 3 ? [createMockReservation("r1")] : []);
      tablesByDate.set(key, [createMockTable("t1")]);
    }

    const result = await weekBuilder.build(startDate, "rest-1", reservationsByDate, tablesByDate);

    expect(result.startDate).toEqual(startDate);
    expect(result.days).toHaveLength(7);
    expect(result.summary.totalReservations).toBe(1);
    expect(result.summary.totalGuests).toBe(4);
    expect(result.summary.averagePartySize).toBe(4);
  });

  it("calculates correct weekly summary with multiple reservations", async () => {
    const occupancyCalc = new CalendarOccupancyCalculator();
    const availabilityCalc = new CalendarAvailabilityCalculator();
    const conflictAgg = new CalendarConflictAggregator(pipeline);
    const dayBuilder = new CalendarDayBuilder(occupancyCalc, availabilityCalc, conflictAgg);
    const weekBuilder = new CalendarWeekBuilder(dayBuilder);

    const startDate = new Date("2026-07-13");
    const reservationsByDate = new Map<string, any[]>();
    const tablesByDate = new Map<string, any[]>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0] ?? "";
      reservationsByDate.set(key, [createMockReservation(`r${i}`, 18, 20)]);
      tablesByDate.set(key, [createMockTable("t1")]);
    }

    const result = await weekBuilder.build(startDate, "rest-1", reservationsByDate, tablesByDate);

    expect(result.summary.totalReservations).toBe(7);
    expect(result.summary.totalGuests).toBe(28);
    expect(result.summary.averageOccupancyRate).toBeGreaterThan(0);
  });
});
