import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationEngine } from "../../engine/ReservationEngine.js";
import { ReservationNumber } from "../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError.js";
import { ReservationStateTransitionError } from "../../errors/ReservationStateTransitionError.js";
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

describe("ReservationEngine", () => {
  let engine: ReservationEngine;
  let mockRepository: any;
  let mockFactory: any;
  let mockEventBus: any;
  let mockAuditService: any;
  let mockAvailabilityService: any;
  let mockCacheInvalidator: any;
  let defaultAuth: any;
  let defaultContext: any;

  const defaultReservation = createMockReservation();
  const confirmedReservation = createMockReservation({
    status: ReservationStatus.create("confirmed"),
  });
  const cancelledReservation = createMockReservation({
    status: ReservationStatus.create("cancelled"),
    cancelledAt: new Date(),
  });
  const checkedInReservation = createMockReservation({
    status: ReservationStatus.create("checked_in"),
  });
  const seatedReservation = createMockReservation({
    status: ReservationStatus.create("seated"),
  });
  const completedReservation = createMockReservation({
    status: ReservationStatus.create("completed"),
  });

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(defaultReservation),
      update: vi.fn().mockResolvedValue(defaultReservation),
      findById: vi.fn().mockResolvedValue(defaultReservation),
      findByIdAndRestaurant: vi.fn().mockResolvedValue(defaultReservation),
      findByRestaurantId: vi.fn().mockResolvedValue([defaultReservation]),
      findByFilters: vi.fn().mockResolvedValue([defaultReservation]),
    };

    mockFactory = {
      create: vi.fn().mockReturnValue(defaultReservation),
      reconstitute: vi.fn().mockReturnValue(defaultReservation),
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

    defaultAuth = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: [],
      scope: { type: "organization", organizationId: "org-1" },
    };

    defaultContext = { auth: defaultAuth };

    engine = new ReservationEngine({
      repository: mockRepository,
      factory: mockFactory,
      eventBus: mockEventBus,
      auditService: mockAuditService,
      availabilityService: mockAvailabilityService,
      cacheInvalidator: mockCacheInvalidator,
    });
  });

  describe("create", () => {
    it("creates a reservation successfully", async () => {
      const result = await engine.create(
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

      expect(result.id).toBe("res-1");
      expect(result.reservationNumber).toBe("RES-001");
      expect(mockFactory.create).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationCreated", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnCreate).toHaveBeenCalledOnce();
    });

    it("checks availability before creation", async () => {
      await engine.create(
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

      expect(mockAvailabilityService.checkAvailability).toHaveBeenCalledOnce();
    });

    it("fails validation for invalid party size", async () => {
      await expect(
        engine.create(
          {
            restaurantId: "rest-1",
            reservationNumber: "RES-001",
            date: "2026-07-14",
            startTime: "2026-07-14T18:00:00Z",
            endTime: "2026-07-14T20:00:00Z",
            partySize: 0,
            source: "website",
          },
          defaultContext,
        ),
      ).rejects.toThrow("Validation failed");
    });

    it("fails validation for missing required fields", async () => {
      await expect(
        engine.create(
          {
            restaurantId: "",
            reservationNumber: "",
            date: "",
            startTime: "",
            endTime: "",
            partySize: 4,
            source: "",
          },
          defaultContext,
        ),
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("confirm", () => {
    it("confirms a pending reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(defaultReservation);
      mockRepository.update.mockResolvedValue(confirmedReservation);

      const result = await engine.confirm(
        { id: "res-1", restaurantId: "rest-1" },
        defaultContext,
      );

      expect(result.status).toBe("confirmed");
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationConfirmed", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        engine.confirm({ id: "missing", restaurantId: "rest-1" }, defaultContext),
      ).rejects.toThrow(ReservationNotFoundError);
    });

    it("throws on invalid transition", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("completed") }),
      );

      await expect(
        engine.confirm({ id: "res-1", restaurantId: "rest-1" }, defaultContext),
      ).rejects.toThrow(ReservationStateTransitionError);
    });

    it("checks availability before confirmation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ tableId: "table-1" }),
      );
      mockRepository.update.mockResolvedValue(confirmedReservation);

      await engine.confirm({ id: "res-1", restaurantId: "rest-1" }, defaultContext);

      expect(mockAvailabilityService.checkAvailability).toHaveBeenCalledOnce();
    });
  });

  describe("cancel", () => {
    it("cancels a pending reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(defaultReservation);
      mockRepository.update.mockResolvedValue(cancelledReservation);

      const result = await engine.cancel(
        { id: "res-1", restaurantId: "rest-1" },
        defaultContext,
      );

      expect(result.status).toBe("cancelled");
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationCancelled", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("throws on invalid transition from completed", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("completed") }),
      );

      await expect(
        engine.cancel({ id: "res-1", restaurantId: "rest-1" }, defaultContext),
      ).rejects.toThrow(ReservationStateTransitionError);
    });
  });

  describe("checkInCommand", () => {
    it("checks in a confirmed reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(confirmedReservation);
      mockRepository.update.mockResolvedValue(checkedInReservation);

      const result = await engine.checkInCommand(
        { id: "res-1", restaurantId: "rest-1" },
        defaultContext,
      );

      expect(result.status).toBe("checked_in");
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("throws on invalid transition from pending", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(defaultReservation);

      await expect(
        engine.checkInCommand({ id: "res-1", restaurantId: "rest-1" }, defaultContext),
      ).rejects.toThrow(ReservationStateTransitionError);
    });
  });

  describe("complete", () => {
    it("completes a seated reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(seatedReservation);
      mockRepository.update.mockResolvedValue(completedReservation);

      const result = await engine.complete(
        { id: "res-1", restaurantId: "rest-1" },
        defaultContext,
      );

      expect(result.status).toBe("completed");
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationCompleted", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("completes a confirmed walk-in directly", async () => {
      const walkIn = createMockReservation({
        status: ReservationStatus.create("confirmed"),
        source: ReservationSource.create("walk_in"),
      });
      mockRepository.findByIdAndRestaurant.mockResolvedValue(walkIn);
      mockRepository.update.mockResolvedValue(
        createMockReservation({
          status: ReservationStatus.create("completed"),
          source: ReservationSource.create("walk_in"),
        }),
      );

      const result = await engine.complete(
        { id: "res-1", restaurantId: "rest-1" },
        defaultContext,
      );

      expect(result.status).toBe("completed");
    });
  });

  describe("update", () => {
    it("updates a reservation successfully", async () => {
      const updatedReservation = createMockReservation({
        partySize: PartySize.create(6),
        notes: "Updated notes",
      });
      mockRepository.update.mockResolvedValue(updatedReservation);

      const result = await engine.update(
        {
          id: "res-1",
          restaurantId: "rest-1",
          partySize: 6,
          notes: "Updated notes",
        },
        defaultContext,
      );

      expect(result.partySize).toBe(6);
      expect(mockAuditService.record).toHaveBeenCalledOnce();
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        engine.update({ id: "missing", restaurantId: "rest-1" }, defaultContext),
      ).rejects.toThrow(ReservationNotFoundError);
    });

    it("throws when updating terminal reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("completed") }),
      );

      await expect(
        engine.update({ id: "res-1", restaurantId: "rest-1", partySize: 6 }, defaultContext),
      ).rejects.toThrow("Validation failed");
    });

    it("updates table assignment", async () => {
      const withTable = createMockReservation({ tableId: "table-2" });
      mockRepository.update.mockResolvedValue(withTable);

      const result = await engine.update(
        {
          id: "res-1",
          restaurantId: "rest-1",
          tableId: "table-2",
        },
        defaultContext,
      );

      expect(result.tableId).toBe("table-2");
    });
  });

  describe("getById", () => {
    it("returns reservation by id", async () => {
      const result = await engine.getById(
        { id: "res-1", restaurantId: "rest-1" },
      );

      expect(result.id).toBe("res-1");
      expect(result.reservationNumber).toBe("RES-001");
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        engine.getById({ id: "missing", restaurantId: "rest-1" }),
      ).rejects.toThrow(ReservationNotFoundError);
    });
  });

  describe("list", () => {
    it("returns summaries", async () => {
      const results = await engine.list(
        { restaurantId: "rest-1" },
      );

      expect(results).toHaveLength(1);
      expect(results[0].reservationNumber).toBe("RES-001");
    });

    it("filters by status", async () => {
      await engine.list(
        { restaurantId: "rest-1", status: "confirmed" },
      );

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({ status: "confirmed" }),
      );
    });
  });

  describe("search", () => {
    it("searches by reservation number", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createMockReservation({ id: "r1", reservationNumber: ReservationNumber.create("RES-001") }),
        createMockReservation({ id: "r2", reservationNumber: ReservationNumber.create("RES-002") }),
      ]);

      const results = await engine.search(
        { restaurantId: "rest-1", query: "001" },
      );

      expect(results).toHaveLength(1);
      expect(results[0].reservationNumber).toBe("RES-001");
    });

    it("returns all when no query", async () => {
      const results = await engine.search(
        { restaurantId: "rest-1" },
      );

      expect(results).toHaveLength(1);
    });
  });
});
