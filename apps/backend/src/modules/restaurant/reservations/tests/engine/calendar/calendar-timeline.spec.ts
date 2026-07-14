import { describe, it, expect } from "vitest";
import { CalendarTimelineBuilder } from "../../../engine/calendar/CalendarTimelineBuilder.js";
import { TableCapacity } from "../../../../tables/domain/models/TableCapacity.js";
import { ReservationDate } from "../../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationStatus } from "../../../domain/models/ReservationStatus.js";

function createMockTable(id: string) {
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
    maximumCapacity: TableCapacity.reconstitute(4),
    currentCapacity: TableCapacity.reconstitute(4),
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

function createMockReservation(
  id: string,
  tableId: string | null,
  startHour: number,
  endHour: number,
  status: string = "confirmed",
) {
  const date = new Date("2026-07-14");
  return {
    id,
    restaurantId: "rest-1",
    reservationNumber: { value: `RES-${id}` },
    customerId: "cust-1",
    tableId,
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

describe("CalendarTimelineBuilder", () => {
  it("builds empty timeline with no reservations", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1"), createMockTable("t2")];

    const result = builder.build(date, "rest-1", [], tables);

    expect(result.date).toEqual(date);
    expect(result.reservations).toHaveLength(0);
    expect(result.slots).toHaveLength(24);
  });

  it("places reservations in correct time slots", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1")];
    const reservations = [createMockReservation("r1", "t1", 18, 20)];

    const result = builder.build(date, "rest-1", reservations, tables);

    const hour18 = result.slots.find((s) => s.time.hour === 18);
    expect(hour18?.reservations).toHaveLength(1);
    expect(hour18?.reservations[0]?.id).toBe("r1");
    expect(hour18?.occupiedCount).toBe(1);
    expect(hour18?.availableCount).toBe(0);
  });

  it("shows tables available in slots without reservations", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1")];
    const reservations = [createMockReservation("r1", "t1", 18, 20)];

    const result = builder.build(date, "rest-1", reservations, tables);

    const hour10 = result.slots.find((s) => s.time.hour === 10);
    expect(hour10?.occupiedCount).toBe(0);
    expect(hour10?.availableCount).toBe(1);
  });

  it("includes all reservations in the reservations array", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1")];
    const reservations = [
      createMockReservation("r1", "t1", 18, 20),
      createMockReservation("r2", "t1", 12, 14),
    ];

    const result = builder.build(date, "rest-1", reservations, tables);

    expect(result.reservations).toHaveLength(2);
  });

  it("shows correct available count based on table usage", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1"), createMockTable("t2")];
    const reservations = [createMockReservation("r1", "t1", 18, 20)];

    const result = builder.build(date, "rest-1", reservations, tables);

    const hour18 = result.slots.find((s) => s.time.hour === 18);
    expect(hour18?.availableCount).toBe(1);
    expect(hour18?.occupiedCount).toBe(1);
  });

  it("handles reservations without table assignments", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1")];
    const reservations = [createMockReservation("r1", null, 18, 20)];

    const result = builder.build(date, "rest-1", reservations, tables);

    const hour18 = result.slots.find((s) => s.time.hour === 18);
    expect(hour18?.occupiedCount).toBe(1);
    expect(hour18?.availableCount).toBe(1);
  });

  it("generates slot labels correctly", () => {
    const builder = new CalendarTimelineBuilder();
    const tables = [createMockTable("t1")];

    const result = builder.build(date, "rest-1", [], tables);

    expect(result.slots[0]?.time.label).toBe("00:00");
    expect(result.slots[12]?.time.label).toBe("12:00");
    expect(result.slots[23]?.time.label).toBe("23:00");
  });
});
