import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationConflictResolver } from "../../engine/conflict/ReservationConflictResolver.js";
import { ReservationNumber } from "../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import type { Reservation } from "../../domain/models/Reservation.js";

function createReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-1",
    restaurantId: "rest-1",
    reservationNumber: ReservationNumber.create("RES-001"),
    customerId: null,
    tableId: "table-1",
    tableGroupId: null,
    date: ReservationDate.create(new Date("2026-07-14")),
    timeRange: ReservationTimeRange.create(
      new Date("2026-07-14T18:00:00Z"),
      new Date("2026-07-14T20:00:00Z"),
    ),
    partySize: PartySize.create(4),
    status: ReservationStatus.create("confirmed"),
    source: ReservationSource.create("website"),
    notes: null,
    specialRequests: null,
    createdBy: "user-1",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    cancelledAt: null,
    ...overrides,
  };
}

describe("ReservationConflictResolver", () => {
  let resolver: ReservationConflictResolver;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByIdAndRestaurant: vi.fn(),
      findByRestaurantId: vi.fn(),
      findByFilters: vi.fn(),
    };

    resolver = new ReservationConflictResolver(mockRepository);
  });

  it("returns no conflicts when there are no overlapping reservations", async () => {
    mockRepository.findByFilters.mockResolvedValue([
      createReservation({
        id: "existing-1",
        tableId: "table-1",
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T12:00:00Z"),
          new Date("2026-07-14T14:00:00Z"),
        ),
      }),
    ]);

    const result = await resolver.checkForConflicts({
      restaurantId: "rest-1",
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      tableId: "table-1",
    });

    expect(result.hasConflict).toBe(false);
    expect(result.conflictingReservations).toHaveLength(0);
  });

  it("detects table conflict with overlapping time", async () => {
    mockRepository.findByFilters.mockResolvedValue([
      createReservation({
        id: "existing-1",
        tableId: "table-1",
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T19:00:00Z"),
          new Date("2026-07-14T21:00:00Z"),
        ),
      }),
    ]);

    const result = await resolver.checkForConflicts({
      restaurantId: "rest-1",
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      tableId: "table-1",
    });

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingReservations).toContain("existing-1");
  });

  it("ignores non-overlapping times for same table", async () => {
    mockRepository.findByFilters.mockResolvedValue([
      createReservation({
        id: "existing-1",
        tableId: "table-1",
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T20:00:00Z"),
          new Date("2026-07-14T22:00:00Z"),
        ),
      }),
    ]);

    const result = await resolver.checkForConflicts({
      restaurantId: "rest-1",
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      tableId: "table-1",
    });

    expect(result.hasConflict).toBe(false);
  });

  it("ignores cancelled reservations for conflict detection", async () => {
    mockRepository.findByFilters.mockResolvedValue([
      createReservation({
        id: "existing-1",
        tableId: "table-1",
        status: ReservationStatus.create("cancelled"),
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T18:30:00Z"),
          new Date("2026-07-14T20:30:00Z"),
        ),
      }),
    ]);

    const result = await resolver.checkForConflicts({
      restaurantId: "rest-1",
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      tableId: "table-1",
    });

    expect(result.hasConflict).toBe(false);
  });

  it("excludes own reservation when checking for update conflicts", async () => {
    mockRepository.findByFilters.mockResolvedValue([
      createReservation({
        id: "res-1",
        tableId: "table-1",
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T18:00:00Z"),
          new Date("2026-07-14T20:00:00Z"),
        ),
      }),
    ]);

    const result = await resolver.checkForConflicts({
      restaurantId: "rest-1",
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      tableId: "table-1",
      excludeReservationId: "res-1",
    });

    expect(result.hasConflict).toBe(false);
  });

  it("detects table group conflict", async () => {
    mockRepository.findByFilters.mockResolvedValue([
      createReservation({
        id: "existing-1",
        tableId: null,
        tableGroupId: "group-1",
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T18:30:00Z"),
          new Date("2026-07-14T20:30:00Z"),
        ),
      }),
    ]);

    const result = await resolver.checkForConflicts({
      restaurantId: "rest-1",
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      tableGroupId: "group-1",
    });

    expect(result.hasConflict).toBe(true);
  });
});
