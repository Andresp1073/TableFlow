import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationEngine } from "../../engine/ReservationEngine.js";
import { ReservationNumber } from "../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import type { Reservation } from "../../domain/models/Reservation.js";

function createMockReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-1",
    restaurantId: "rest-1",
    reservationNumber: ReservationNumber.create("RES-001"),
    customerId: "cust-1",
    tableId: null,
    tableGroupId: null,
    date: ReservationDate.create(new Date("2026-07-14")),
    timeRange: ReservationTimeRange.create(
      new Date("2026-07-14T18:00:00Z"),
      new Date("2026-07-14T20:00:00Z"),
    ),
    partySize: PartySize.create(4),
    status: ReservationStatus.create("pending"),
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

describe("Reservation Workflow", () => {
  let engine: ReservationEngine;
  let mockRepository: any;
  let mockFactory: any;
  let mockEventBus: any;
  let mockAuditService: any;
  let mockAvailabilityService: any;
  let mockCacheInvalidator: any;
  let defaultContext: any;

  let currentState: Reservation;

  beforeEach(() => {
    currentState = createMockReservation();

    mockRepository = {
      save: vi.fn().mockImplementation((r: Reservation) => Promise.resolve({ ...r, id: "res-1" })),
      update: vi.fn().mockImplementation((r: Reservation) => {
        currentState = { ...currentState, ...r };
        return Promise.resolve(currentState);
      }),
      findByIdAndRestaurant: vi.fn().mockImplementation(() => Promise.resolve(currentState)),
      findByFilters: vi.fn().mockResolvedValue([]),
    };

    mockFactory = {
      create: vi.fn().mockReturnValue(createMockReservation()),
      reconstitute: vi.fn().mockReturnValue(createMockReservation()),
    };

    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockAvailabilityService = {
      checkAvailability: vi.fn().mockResolvedValue({ available: true, reason: null }),
    };

    mockCacheInvalidator = {
      invalidateOnCreate: vi.fn().mockResolvedValue(undefined),
      invalidateOnUpdate: vi.fn().mockResolvedValue(undefined),
      invalidateOnStatusChange: vi.fn().mockResolvedValue(undefined),
    };

    const auth = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: [],
      scope: { type: "organization", organizationId: "org-1" },
    };
    defaultContext = { auth };

    engine = new ReservationEngine({
      repository: mockRepository,
      factory: mockFactory,
      eventBus: mockEventBus,
      auditService: mockAuditService,
      availabilityService: mockAvailabilityService,
      cacheInvalidator: mockCacheInvalidator,
    });
  });

  it("completes full reservation lifecycle: create → confirm → check-in → complete", async () => {
    currentState = createMockReservation();

    const created = await engine.create(
      {
        restaurantId: "rest-1",
        reservationNumber: "RES-001",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
        source: "website",
      },
      defaultContext,
    );
    expect(created.status).toBe("pending");

    currentState = createMockReservation();
    const confirmed = await engine.confirm(
      { id: "res-1", restaurantId: "rest-1" },
      defaultContext,
    );
    expect(confirmed.status).toBe("confirmed");

    currentState = createMockReservation({
      status: ReservationStatus.create("confirmed"),
    });
    const checkedIn = await engine.checkInCommand(
      { id: "res-1", restaurantId: "rest-1" },
      defaultContext,
    );
    expect(checkedIn.status).toBe("checked_in");

    currentState = createMockReservation({
      status: ReservationStatus.create("seated"),
    });
    const completed = await engine.complete(
      { id: "res-1", restaurantId: "rest-1" },
      defaultContext,
    );
    expect(completed.status).toBe("completed");
  });

  it("handles cancellation from pending state", async () => {
    currentState = createMockReservation();
    const created = await engine.create(
      {
        restaurantId: "rest-1",
        reservationNumber: "RES-002",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 2,
        source: "phone",
      },
      defaultContext,
    );
    expect(created.status).toBe("pending");

    currentState = createMockReservation();
    const cancelled = await engine.cancel(
      { id: "res-1", restaurantId: "rest-1" },
      defaultContext,
    );
    expect(cancelled.status).toBe("cancelled");
  });

  it("prevents double cancellation from terminal state", async () => {
    currentState = createMockReservation({
      status: ReservationStatus.create("cancelled"),
    });

    await expect(
      engine.cancel({ id: "res-1", restaurantId: "rest-1" }, defaultContext),
    ).rejects.toThrow();
  });

  it("prevents confirming an already completed reservation", async () => {
    currentState = createMockReservation({
      status: ReservationStatus.create("completed"),
    });

    await expect(
      engine.confirm({ id: "res-1", restaurantId: "rest-1" }, defaultContext),
    ).rejects.toThrow();
  });

  it("allows creation with optional fields", async () => {
    const withFields = createMockReservation({
      customerId: "cust-1",
      tableId: "table-1",
      partySize: PartySize.create(2),
      source: ReservationSource.create("phone"),
      notes: "Window seat please",
      specialRequests: "Anniversary dinner",
    });
    mockFactory.create.mockReturnValue(withFields);
    mockRepository.save.mockResolvedValue(withFields);

    const result = await engine.create(
      {
        restaurantId: "rest-1",
        reservationNumber: "RES-010",
        customerId: "cust-1",
        tableId: "table-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 2,
        source: "phone",
        notes: "Window seat please",
        specialRequests: "Anniversary dinner",
      },
      defaultContext,
    );

    expect(result.customerId).toBe("cust-1");
    expect(result.tableId).toBe("table-1");
    expect(result.partySize).toBe(2);
    expect(result.source).toBe("phone");
  });
});
