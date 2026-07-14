import { describe, it, expect } from "vitest";
import { CalendarOccupancyCalculator } from "../../../engine/calendar/CalendarOccupancyCalculator.js";
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

function createMockReservation(id: string, startHour: number, endHour: number, partySize: number) {
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

describe("CalendarOccupancyCalculator", () => {
  it("calculates empty occupancy when no reservations", () => {
    const calc = new CalendarOccupancyCalculator();
    const tables = [createMockTable("t1", 4), createMockTable("t2", 6)];

    const result = calc.calculate(date, "rest-1", tables, [], []);

    expect(result.totalTables).toBe(2);
    expect(result.totalCapacity).toBe(10);
    expect(result.occupiedTables).toBe(0);
    expect(result.occupiedCapacity).toBe(0);
    expect(result.occupancyRate).toBe(0);
    expect(result.peakOccupancyHour).toBeNull();
  });

  it("calculates occupancy with active reservations", () => {
    const calc = new CalendarOccupancyCalculator();
    const tables = [createMockTable("t1", 4), createMockTable("t2", 6)];
    const reservations = [createMockReservation("r1", 18, 20, 4)];

    const result = calc.calculate(date, "rest-1", tables, [], reservations);

    expect(result.totalTables).toBe(2);
    expect(result.occupiedTables).toBe(1);
    expect(result.occupancyRate).toBe(50);
    expect(result.occupiedCapacity).toBe(4);
    expect(result.capacityRate).toBe(40);
  });

  it("calculates hourly breakdown across 24 hours", () => {
    const calc = new CalendarOccupancyCalculator();
    const tables = [createMockTable("t1", 4)];
    const reservations = [createMockReservation("r1", 18, 20, 4)];

    const result = calc.calculate(date, "rest-1", tables, [], reservations);

    expect(result.hourlyBreakdown).toHaveLength(24);

    const hour18 = result.hourlyBreakdown.find((h) => h.hour === 18);
    expect(hour18).toBeDefined();
    expect(hour18?.occupiedTables).toBe(1);

    const hour10 = result.hourlyBreakdown.find((h) => h.hour === 10);
    expect(hour10?.occupiedTables).toBe(0);
  });

  it("finds peak occupancy hour", () => {
    const calc = new CalendarOccupancyCalculator();
    const tables = [createMockTable("t1", 4), createMockTable("t2", 4)];
    const reservations = [
      createMockReservation("r1", 18, 20, 4),
      createMockReservation("r2", 19, 21, 4),
      createMockReservation("r3", 12, 14, 2),
    ];

    const result = calc.calculate(date, "rest-1", tables, [], reservations);

    expect(result.peakOccupancyHour).toBe(19);
    expect(result.occupiedTables).toBe(3);
  });

  it("handles cancelled reservations as not active", () => {
    const calc = new CalendarOccupancyCalculator();
    const tables = [createMockTable("t1", 4)];
    const cancelledRes = {
      ...createMockReservation("r1", 18, 20, 4),
      status: ReservationStatus.create("cancelled"),
    };

    const result = calc.calculate(date, "rest-1", tables, [], [cancelledRes]);

    expect(result.occupiedTables).toBe(0);
    expect(result.occupancyRate).toBe(0);
  });

  it("handles completed reservations as not active", () => {
    const calc = new CalendarOccupancyCalculator();
    const tables = [createMockTable("t1", 4)];
    const completedRes = {
      ...createMockReservation("r1", 18, 20, 4),
      status: ReservationStatus.create("completed"),
    };

    const result = calc.calculate(date, "rest-1", tables, [], [completedRes]);

    expect(result.occupiedTables).toBe(0);
  });

  it("handles zero tables gracefully", () => {
    const calc = new CalendarOccupancyCalculator();

    const result = calc.calculate(date, "rest-1", [], [], []);

    expect(result.totalTables).toBe(0);
    expect(result.totalCapacity).toBe(0);
    expect(result.occupancyRate).toBe(0);
    expect(result.peakOccupancyHour).toBeNull();
  });
});
