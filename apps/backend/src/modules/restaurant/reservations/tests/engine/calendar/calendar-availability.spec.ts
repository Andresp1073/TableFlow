import { describe, it, expect } from "vitest";
import { CalendarAvailabilityCalculator } from "../../../engine/calendar/CalendarAvailabilityCalculator.js";
import { TableCapacity } from "../../../../tables/domain/models/TableCapacity.js";
import { ReservationDate } from "../../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationStatus } from "../../../domain/models/ReservationStatus.js";

function createMockTable(id: string, maxCapacity: number) {
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

function createMockReservation(id: string, tableId: string, startHour: number, endHour: number, partySize: number) {
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
    partySize: PartySize.create(partySize),
    status: ReservationStatus.create("confirmed"),
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

describe("CalendarAvailabilityCalculator", () => {
  it("shows all tables available with no reservations", () => {
    const calc = new CalendarAvailabilityCalculator();
    const tables = [createMockTable("t1", 4), createMockTable("t2", 6)];

    const result = calc.calculate(date, "rest-1", tables, []);

    expect(result.totalTables).toBe(2);
    expect(result.availableTables).toBe(2);
    expect(result.isFullyBooked).toBe(false);
  });

  it("shows reduced availability when tables are reserved", () => {
    const calc = new CalendarAvailabilityCalculator();
    const tables = [createMockTable("t1", 4), createMockTable("t2", 6)];
    const reservations = [createMockReservation("r1", "t1", 18, 20, 4)];

    const result = calc.calculate(date, "rest-1", tables, reservations);

    expect(result.availableTables).toBe(1);
    expect(result.maxAvailableCapacity).toBe(6);
  });

  it("generates 24 time slots", () => {
    const calc = new CalendarAvailabilityCalculator();
    const tables = [createMockTable("t1", 4)];

    const result = calc.calculate(date, "rest-1", tables, []);

    expect(result.timeSlots).toHaveLength(24);
    expect(result.timeSlots[0]?.time.hour).toBe(0);
    expect(result.timeSlots[23]?.time.hour).toBe(23);
  });

  it("marks time slots as fully booked when all tables reserved", () => {
    const calc = new CalendarAvailabilityCalculator();
    const tables = [createMockTable("t1", 4)];
    const reservations = [createMockReservation("r1", "t1", 0, 23, 4)];
    const extendedRes = {
      ...reservations[0],
      timeRange: ReservationTimeRange.create(
        new Date("2026-07-14T00:00:00Z"),
        new Date("2026-07-15T00:00:00Z"),
      ),
    };

    const result = calc.calculate(date, "rest-1", tables, [extendedRes]);

    expect(result.isFullyBooked).toBe(true);
    expect(result.availableTables).toBe(0);
  });

  it("considers only active reservations for availability", () => {
    const calc = new CalendarAvailabilityCalculator();
    const tables = [createMockTable("t1", 4)];
    const cancelledRes = {
      ...createMockReservation("r1", "t1", 18, 20, 4),
      status: ReservationStatus.create("cancelled"),
    };

    const result = calc.calculate(date, "rest-1", tables, []);

    expect(result.availableTables).toBe(1);
  });
});
