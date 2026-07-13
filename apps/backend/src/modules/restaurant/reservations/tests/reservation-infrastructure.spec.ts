import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConcreteReservationFactory } from "../infrastructure/repositories/ConcreteReservationFactory.js";
import { PrismaReservationRepository } from "../infrastructure/repositories/PrismaReservationRepository.js";
import { ReservationNumber } from "../domain/models/ReservationNumber.js";
import { ReservationDate } from "../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../domain/models/ReservationTimeRange.js";
import { PartySize } from "../domain/models/PartySize.js";
import { ReservationSource } from "../domain/models/ReservationSource.js";
import { ReservationStatus } from "../domain/models/ReservationStatus.js";
import type { Reservation } from "../domain/models/Reservation.js";

describe("ConcreteReservationFactory", () => {
  const factory = new ConcreteReservationFactory();

  it("creates a new reservation", () => {
    const reservationNumber = ReservationNumber.create("RES-001");
    const date = ReservationDate.create(new Date("2026-07-14"));
    const timeRange = ReservationTimeRange.create(
      new Date("2026-07-14T18:00:00Z"),
      new Date("2026-07-14T20:00:00Z"),
    );
    const partySize = PartySize.create(4);
    const source = ReservationSource.create("website");

    const reservation = factory.create({
      restaurantId: "rest-1",
      reservationNumber,
      customerId: "cust-1",
      tableId: "table-1",
      date,
      timeRange,
      partySize,
      source,
      notes: "Window seat",
      specialRequests: "Anniversary",
      createdBy: "user-1",
    });

    expect(reservation.id).toBeTypeOf("string");
    expect(reservation.restaurantId).toBe("rest-1");
    expect(reservation.reservationNumber).toBe(reservationNumber);
    expect(reservation.customerId).toBe("cust-1");
    expect(reservation.tableId).toBe("table-1");
    expect(reservation.partySize).toBe(partySize);
    expect(reservation.status.value).toBe("pending");
    expect(reservation.source.value).toBe("website");
    expect(reservation.notes).toBe("Window seat");
    expect(reservation.specialRequests).toBe("Anniversary");
    expect(reservation.createdBy).toBe("user-1");
    expect(reservation.createdAt).toBeInstanceOf(Date);
    expect(reservation.updatedAt).toBeInstanceOf(Date);
    expect(reservation.cancelledAt).toBeNull();
  });

  it("creates without optional fields", () => {
    const reservationNumber = ReservationNumber.create("RES-002");
    const date = ReservationDate.create(new Date("2026-07-15"));
    const timeRange = ReservationTimeRange.create(
      new Date("2026-07-15T19:00:00Z"),
      new Date("2026-07-15T21:00:00Z"),
    );
    const partySize = PartySize.create(2);
    const source = ReservationSource.create("walk_in");

    const reservation = factory.create({
      restaurantId: "rest-1",
      reservationNumber,
      date,
      timeRange,
      partySize,
      source,
      createdBy: "user-1",
    });

    expect(reservation.customerId).toBeNull();
    expect(reservation.tableId).toBeNull();
    expect(reservation.tableGroupId).toBeNull();
    expect(reservation.notes).toBeNull();
    expect(reservation.specialRequests).toBeNull();
    expect(reservation.status.value).toBe("pending");
  });

  it("reconstitutes from stored data", () => {
    const reservation = factory.reconstitute({
      id: "res-1",
      restaurantId: "rest-1",
      reservationNumber: "RES-001",
      customerId: "cust-1",
      tableId: "table-1",
      tableGroupId: null,
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
      endTime: new Date("2026-07-14T20:00:00Z"),
      partySize: 4,
      status: "confirmed",
      source: "website",
      notes: null,
      specialRequests: null,
      createdBy: "user-1",
      createdAt: new Date("2026-07-01"),
      updatedAt: new Date("2026-07-02"),
      cancelledAt: null,
    });

    expect(reservation.id).toBe("res-1");
    expect(reservation.reservationNumber.value).toBe("RES-001");
    expect(reservation.status.value).toBe("confirmed");
    expect(reservation.date.value).toBeInstanceOf(Date);
    expect(reservation.timeRange.startTime).toBeInstanceOf(Date);
    expect(reservation.timeRange.endTime).toBeInstanceOf(Date);
    expect(reservation.partySize.value).toBe(4);
  });

  it("uses custom status when provided", () => {
    const reservationNumber = ReservationNumber.create("RES-003");
    const date = ReservationDate.create(new Date("2026-07-16"));
    const timeRange = ReservationTimeRange.create(
      new Date("2026-07-16T18:00:00Z"),
      new Date("2026-07-16T20:00:00Z"),
    );
    const partySize = PartySize.create(2);
    const source = ReservationSource.create("phone");

    const reservation = factory.create({
      restaurantId: "rest-1",
      reservationNumber,
      date,
      timeRange,
      partySize,
      source,
      status: ReservationStatus.create("confirmed"),
      createdBy: "user-1",
    });

    expect(reservation.status.value).toBe("confirmed");
  });
});

describe("PrismaReservationRepository", () => {
  let repository: PrismaReservationRepository;
  let mockPrisma: any;
  let factory: ConcreteReservationFactory;

  const mockPrismaRecord = {
    id: "res-1",
    organizationId: "rest-1",
    branchId: "rest-1",
    customerId: "cust-1",
    confirmationCode: "RES-001",
    partySize: 4,
    reservationDate: new Date("2026-07-14"),
    startTime: new Date("2026-07-14T18:00:00Z"),
    endTime: new Date("2026-07-14T20:00:00Z"),
    status: "pending",
    specialRequests: null,
    notes: null,
    walkIn: false,
    source: "website",
    tableGroupId: null,
    createdBy: "user-1",
    assignedTo: null,
    cancelledAt: null,
    cancelReason: null,
    noShowMarkedAt: null,
    seatedAt: null,
    completedAt: null,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    updatedBy: null,
    tableAssignments: [{ tableId: "table-1" }],
  };

  const createDomainReservation = () =>
    factory.create({
      restaurantId: "rest-1",
      reservationNumber: ReservationNumber.create("RES-001"),
      customerId: "cust-1",
      tableId: "table-1",
      date: ReservationDate.create(new Date("2026-07-14")),
      timeRange: ReservationTimeRange.create(
        new Date("2026-07-14T18:00:00Z"),
        new Date("2026-07-14T20:00:00Z"),
      ),
      partySize: PartySize.create(4),
      source: ReservationSource.create("website"),
      createdBy: "user-1",
    });

  beforeEach(() => {
    factory = new ConcreteReservationFactory();
    mockPrisma = {
      reservation: {
        create: vi.fn().mockResolvedValue(mockPrismaRecord),
        update: vi.fn().mockResolvedValue(mockPrismaRecord),
        findUnique: vi.fn().mockResolvedValue(mockPrismaRecord),
        findFirst: vi.fn().mockResolvedValue(mockPrismaRecord),
        findMany: vi.fn().mockResolvedValue([mockPrismaRecord]),
      },
      reservationTable: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    repository = new PrismaReservationRepository(mockPrisma, factory);
  });

  describe("save", () => {
    it("creates a reservation via Prisma", async () => {
      const domain = createDomainReservation();
      const result = await repository.save(domain);

      expect(result.id).toBe("res-1");
      expect(result.reservationNumber.value).toBe("RES-001");
      expect(result.status.value).toBe("pending");
      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "rest-1",
            confirmationCode: "RES-001",
            partySize: 4,
          }),
          include: { tableAssignments: { select: { tableId: true } } },
        }),
      );
    });

    it("creates without table assignment", async () => {
      const noTableRecord = { ...mockPrismaRecord, tableAssignments: [] };
      mockPrisma.reservation.create.mockResolvedValue(noTableRecord);

      const domain = factory.create({
        restaurantId: "rest-1",
        reservationNumber: ReservationNumber.create("RES-002"),
        date: ReservationDate.create(new Date("2026-07-14")),
        timeRange: ReservationTimeRange.create(
          new Date("2026-07-14T18:00:00Z"),
          new Date("2026-07-14T20:00:00Z"),
        ),
        partySize: PartySize.create(2),
        source: ReservationSource.create("walk_in"),
        createdBy: "user-1",
      });

      const result = await repository.save(domain);

      expect(result.tableId).toBeNull();
      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableAssignments: undefined,
          }),
        }),
      );
    });
  });

  describe("update", () => {
    it("updates a reservation via Prisma", async () => {
      const domain = createDomainReservation();
      const updatedRecord = { ...mockPrismaRecord, status: "confirmed" };
      mockPrisma.reservation.update.mockResolvedValue(updatedRecord);

      const domainUpdated: Reservation = { ...domain, status: ReservationStatus.create("confirmed") };
      const result = await repository.update(domainUpdated);

      expect(result.status.value).toBe("confirmed");
      expect(mockPrisma.reservationTable.deleteMany).toHaveBeenCalledWith({
        where: { reservationId: domain.id },
      });
      expect(mockPrisma.reservation.update).toHaveBeenCalledOnce();
    });
  });

  describe("findById", () => {
    it("finds by id", async () => {
      const result = await repository.findById("res-1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("res-1");
      expect(mockPrisma.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: "res-1" },
        include: { tableAssignments: { select: { tableId: true } } },
      });
    });

    it("returns null when not found", async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      const result = await repository.findById("missing");
      expect(result).toBeNull();
    });
  });

  describe("findByIdAndRestaurant", () => {
    it("finds by id and restaurant", async () => {
      const result = await repository.findByIdAndRestaurant("res-1", "rest-1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("res-1");
      expect(mockPrisma.reservation.findFirst).toHaveBeenCalledWith({
        where: { id: "res-1", organizationId: "rest-1" },
        include: { tableAssignments: { select: { tableId: true } } },
      });
    });
  });

  describe("findByRestaurantId", () => {
    it("finds all by restaurant", async () => {
      const results = await repository.findByRestaurantId("rest-1");

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("res-1");
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "rest-1" },
        }),
      );
    });
  });

  describe("findByFilters", () => {
    it("filters by status", async () => {
      await repository.findByFilters({ restaurantId: "rest-1", status: "confirmed" });

      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "confirmed" }),
        }),
      );
    });

    it("filters by date", async () => {
      const date = new Date("2026-07-14");
      await repository.findByFilters({ restaurantId: "rest-1", date });

      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reservationDate: date }),
        }),
      );
    });

    it("filters by customerId", async () => {
      await repository.findByFilters({ restaurantId: "rest-1", customerId: "cust-1" });

      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: "cust-1" }),
        }),
      );
    });
  });
});
