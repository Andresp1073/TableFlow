import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationMapper } from "../application/dto/ReservationMapper.js";
import { ReservationValidator } from "../application/validators/ReservationValidator.js";
import { ReservationApplicationService } from "../application/services/ReservationApplicationService.js";
import { ReservationNumber } from "../domain/models/ReservationNumber.js";
import { ReservationDate } from "../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../domain/models/ReservationTimeRange.js";
import { PartySize } from "../domain/models/PartySize.js";
import { ReservationSource } from "../domain/models/ReservationSource.js";
import { ReservationStatus } from "../domain/models/ReservationStatus.js";
import { ReservationPolicyViolationError } from "../errors/ReservationPolicyViolationError.js";
import { ReservationNotFoundError } from "../errors/ReservationNotFoundError.js";
import { ReservationStateTransitionError } from "../errors/ReservationStateTransitionError.js";
import type { Reservation } from "../domain/models/Reservation.js";

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

describe("ReservationMapper", () => {
  it("maps Reservation to DTO", () => {
    const reservation = createMockReservation();
    const dto = ReservationMapper.toDTO(reservation);

    expect(dto.id).toBe("res-1");
    expect(dto.restaurantId).toBe("rest-1");
    expect(dto.reservationNumber).toBe("RES-001");
    expect(dto.customerId).toBe("cust-1");
    expect(dto.tableId).toBeNull();
    expect(dto.partySize).toBe(4);
    expect(dto.status).toBe("pending");
    expect(dto.source).toBe("website");
    expect(dto.notes).toBeNull();
    expect(dto.specialRequests).toBeNull();
    expect(dto.cancelledAt).toBeNull();
    expect(typeof dto.date).toBe("string");
    expect(typeof dto.startTime).toBe("string");
    expect(typeof dto.endTime).toBe("string");
    expect(typeof dto.createdAt).toBe("string");
    expect(typeof dto.updatedAt).toBe("string");
  });

  it("maps cancelled reservation to DTO", () => {
    const reservation = createMockReservation({
      status: ReservationStatus.create("cancelled"),
      cancelledAt: new Date("2026-07-14T19:00:00Z"),
    });
    const dto = ReservationMapper.toDTO(reservation);

    expect(dto.status).toBe("cancelled");
    expect(dto.cancelledAt).toBe("2026-07-14T19:00:00.000Z");
  });

  it("maps Reservation to Summary", () => {
    const reservation = createMockReservation();
    const summary = ReservationMapper.toSummary(reservation);

    expect(summary.id).toBe("res-1");
    expect(summary.reservationNumber).toBe("RES-001");
    expect(summary.partySize).toBe(4);
    expect(summary.status).toBe("pending");
    expect(summary.createdAt).toBeTypeOf("string");
  });

  it("maps arrays with toDTOList", () => {
    const reservations = [
      createMockReservation({ id: "r1" }),
      createMockReservation({ id: "r2" }),
    ];
    const dtos = ReservationMapper.toDTOList(reservations);

    expect(dtos).toHaveLength(2);
    expect(dtos[0].id).toBe("r1");
    expect(dtos[1].id).toBe("r2");
  });

  it("maps arrays with toSummaryList", () => {
    const reservations = [
      createMockReservation({ id: "r1" }),
      createMockReservation({ id: "r2" }),
    ];
    const summaries = ReservationMapper.toSummaryList(reservations);

    expect(summaries).toHaveLength(2);
    expect(summaries[0].id).toBe("r1");
    expect(summaries[1].id).toBe("r2");
  });
});

describe("ReservationValidator", () => {
  const validator = new ReservationValidator();

  describe("validateCreateRequest", () => {
    it("passes valid request", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          source: "website",
        }),
      ).not.toThrow();
    });

    it("throws for missing restaurantId", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          source: "website",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws for missing reservationNumber", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          source: "website",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws for missing date", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          source: "website",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws for partySize < 1", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 0,
          source: "website",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws for partySize > 100", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 101,
          source: "website",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws for missing source", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          source: "",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws when endTime <= startTime", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T20:00:00Z",
          endTime: "2026-07-14T18:00:00Z",
          partySize: 4,
          source: "website",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });
  });

  describe("validateUpdateRequest", () => {
    it("passes empty update", () => {
      expect(() => validator.validateUpdateRequest({})).not.toThrow();
    });

    it("throws for partySize < 1", () => {
      expect(() =>
        validator.validateUpdateRequest({ partySize: 0 }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws for partySize > 100", () => {
      expect(() =>
        validator.validateUpdateRequest({ partySize: 101 }),
      ).toThrow(ReservationPolicyViolationError);
    });

    it("throws when endTime <= startTime", () => {
      expect(() =>
        validator.validateUpdateRequest({
          startTime: "2026-07-14T20:00:00Z",
          endTime: "2026-07-14T18:00:00Z",
        }),
      ).toThrow(ReservationPolicyViolationError);
    });
  });
});

describe("ReservationApplicationService", () => {
  let service: ReservationApplicationService;
  let mockRepository: any;
  let mockFactory: any;
  let mockAuthService: any;
  let mockEventBus: any;
  let mockAuditService: any;
  let mockCacheInvalidator: any;
  let mockAuth: any;

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

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(defaultReservation),
      update: vi.fn().mockResolvedValue(defaultReservation),
      findByIdAndRestaurant: vi.fn().mockResolvedValue(defaultReservation),
      findByRestaurantId: vi.fn().mockResolvedValue([defaultReservation]),
      findByFilters: vi.fn().mockResolvedValue([defaultReservation]),
    };

    mockFactory = {
      create: vi.fn().mockReturnValue(defaultReservation),
      reconstitute: vi.fn().mockReturnValue(defaultReservation),
    };

    mockAuthService = {
      authorize: vi.fn().mockResolvedValue(undefined),
    };

    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockCacheInvalidator = {
      invalidateOnCreate: vi.fn().mockResolvedValue(undefined),
      invalidateOnUpdate: vi.fn().mockResolvedValue(undefined),
      invalidateOnStatusChange: vi.fn().mockResolvedValue(undefined),
    };

    mockAuth = {
      userId: "user-1",
      organizationId: "org-1",
      restaurantIds: ["rest-1"],
      roles: ["admin"],
    };

    service = new ReservationApplicationService(
      mockRepository,
      mockFactory,
      mockAuthService,
      mockEventBus,
      mockAuditService,
      mockCacheInvalidator,
    );
  });

  describe("create", () => {
    it("creates a reservation successfully", async () => {
      const result = await service.create(
        {
          restaurantId: "rest-1",
          reservationNumber: "RES-001",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          source: "website",
        },
        mockAuth,
      );

      expect(result.id).toBe("res-1");
      expect(result.reservationNumber).toBe("RES-001");
      expect(mockAuthService.authorize).toHaveBeenCalledWith(mockAuth, "restaurants.reservations.create");
      expect(mockFactory.create).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationCreated", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnCreate).toHaveBeenCalledOnce();
    });

    it("creates with optional fields", async () => {
      const mockWithFields = createMockReservation({
        customerId: "cust-1",
        tableId: "table-1",
        partySize: PartySize.create(2),
        source: ReservationSource.create("phone"),
        notes: "Window seat",
        specialRequests: "Anniversary",
      });
      mockFactory.create.mockReturnValue(mockWithFields);
      mockRepository.save.mockResolvedValue(mockWithFields);

      const result = await service.create(
        {
          restaurantId: "rest-1",
          reservationNumber: "RES-002",
          customerId: "cust-1",
          tableId: "table-1",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 2,
          source: "phone",
          notes: "Window seat",
          specialRequests: "Anniversary",
        },
        mockAuth,
      );

      expect(result.customerId).toBe("cust-1");
      expect(result.partySize).toBe(2);
      expect(result.source).toBe("phone");
    });
  });

  describe("confirm", () => {
    it("confirms a pending reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(defaultReservation);
      mockRepository.update.mockResolvedValue(confirmedReservation);

      const result = await service.confirm(
        { id: "res-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("confirmed");
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationConfirmed", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        service.confirm({ id: "missing", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(ReservationNotFoundError);
    });

    it("throws on invalid transition", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("completed") }),
      );

      await expect(
        service.confirm({ id: "res-1", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(ReservationStateTransitionError);
    });
  });

  describe("cancel", () => {
    it("cancels a reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(defaultReservation);
      mockRepository.update.mockResolvedValue(cancelledReservation);

      const result = await service.cancel(
        { id: "res-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("cancelled");
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationCancelled", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("throws on invalid transition", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("completed") }),
      );

      await expect(
        service.cancel({ id: "res-1", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(ReservationStateTransitionError);
    });
  });

  describe("checkIn", () => {
    it("checks in a confirmed reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(confirmedReservation);
      mockRepository.update.mockResolvedValue(checkedInReservation);

      const result = await service.checkIn(
        { id: "res-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("checked_in");
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });
  });

  describe("complete", () => {
    it("completes a reservation", async () => {
      const completedReservation = createMockReservation({
        status: ReservationStatus.create("completed"),
      });
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("seated") }),
      );
      mockRepository.update.mockResolvedValue(completedReservation);

      const result = await service.complete(
        { id: "res-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("completed");
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationCompleted", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnStatusChange).toHaveBeenCalledOnce();
    });

    it("allows walk-in confirmed → completed directly", async () => {
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

      const result = await service.complete(
        { id: "res-1", restaurantId: "rest-1" },
        mockAuth,
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

      const result = await service.update(
        {
          id: "res-1",
          restaurantId: "rest-1",
          partySize: 6,
          notes: "Updated notes",
        },
        mockAuth,
      );

      expect(result.partySize).toBe(6);
      expect(mockEventBus.emit).toHaveBeenCalledWith("ReservationConfirmed", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        service.update({ id: "missing", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(ReservationNotFoundError);
    });

    it("throws when updating terminal reservation", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockReservation({ status: ReservationStatus.create("completed") }),
      );

      await expect(
        service.update({ id: "res-1", restaurantId: "rest-1", partySize: 6 }, mockAuth),
      ).rejects.toThrow(ReservationPolicyViolationError);
    });

    it("updates table assignment", async () => {
      const withTable = createMockReservation({ tableId: "table-2" });
      mockRepository.update.mockResolvedValue(withTable);

      const result = await service.update(
        {
          id: "res-1",
          restaurantId: "rest-1",
          tableId: "table-2",
        },
        mockAuth,
      );

      expect(result.tableId).toBe("table-2");
    });
  });

  describe("getById", () => {
    it("returns reservation by id", async () => {
      const result = await service.getById(
        { id: "res-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.id).toBe("res-1");
      expect(result.reservationNumber).toBe("RES-001");
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        service.getById({ id: "missing", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(ReservationNotFoundError);
    });
  });

  describe("list", () => {
    it("returns summaries", async () => {
      const results = await service.list(
        { restaurantId: "rest-1" },
        mockAuth,
      );

      expect(results).toHaveLength(1);
      expect(results[0].reservationNumber).toBe("RES-001");
    });

    it("filters by status", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createMockReservation({ id: "r1", status: ReservationStatus.create("pending") }),
        createMockReservation({ id: "r2", status: ReservationStatus.create("confirmed") }),
      ]);

      const filters = vi.mocked(mockRepository.findByFilters).mock.calls[0]?.[0] ?? null;

      const results = await service.list(
        { restaurantId: "rest-1", status: "confirmed" },
        mockAuth,
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

      const results = await service.search(
        { restaurantId: "rest-1", query: "001" },
        mockAuth,
      );

      expect(results).toHaveLength(1);
      expect(results[0].reservationNumber).toBe("RES-001");
    });

    it("returns all when no query", async () => {
      const results = await service.search(
        { restaurantId: "rest-1" },
        mockAuth,
      );

      expect(results).toHaveLength(1);
    });
  });
});
