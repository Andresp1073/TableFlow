import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutoAssignmentEngine } from "../../../engine/assignment/AutoAssignmentEngine.js";
import { BestFitAssignmentStrategy } from "../../../engine/assignment/AssignmentStrategy.js";
import { TableCapacity } from "../../../../tables/domain/models/TableCapacity.js";
import { ReservationDate } from "../../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationSource } from "../../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../../domain/models/ReservationStatus.js";
import { ReservationNumber } from "../../../domain/models/ReservationNumber.js";
import { TableGroupId } from "../../../../table-groups/domain/models/TableGroupId.js";
import { DisplayOrder } from "../../../../table-groups/domain/models/DisplayOrder.js";

function createMockTable(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    restaurantId: "rest-1",
    branchId: "branch-1",
    diningAreaId: overrides.diningAreaId === undefined ? "area-1" : overrides.diningAreaId,
    tableTypeId: "type-1",
    tableNumber: { value: `T${id}` },
    name: { value: `Table ${id}` },
    description: null,
    minimumCapacity: TableCapacity.reconstitute(overrides.minimumCapacity === undefined ? 2 : (overrides.minimumCapacity as number)),
    maximumCapacity: TableCapacity.reconstitute(overrides.maximumCapacity === undefined ? 4 : (overrides.maximumCapacity as number)),
    currentCapacity: TableCapacity.reconstitute(overrides.maximumCapacity === undefined ? 4 : (overrides.maximumCapacity as number)),
    shape: "round",
    width: 100,
    height: 100,
    position: null,
    rotation: null,
    qrIdentifier: null,
    isReservable: true,
    isAccessible: overrides.isAccessible === undefined ? false : (overrides.isAccessible as boolean),
    isActive: true,
    status: { value: "available" },
    metadata: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
  };
}

function createMockGroup(id: string, tableIds: string[]) {
  return {
    id: TableGroupId.reconstitute(id),
    restaurantId: "rest-1",
    name: { value: "Group 1" },
    description: null,
    status: { value: "active" },
    isActive: true,
    createdBy: "user-1",
    members: tableIds.map((tid, idx) => ({
      tableId: tid,
      displayOrder: DisplayOrder.reconstitute(idx),
      joinedAt: new Date("2026-01-01"),
    })),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    releasedAt: null,
  };
}

const defaultContext = {
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
};

describe("AutoAssignmentEngine workflow", () => {
  let mockAvailabilityService: any;
  let mockTableRepository: any;
  let mockTableGroupRepository: any;
  let mockReservationRepository: any;
  let engine: AutoAssignmentEngine;

  beforeEach(() => {
    mockAvailabilityService = {
      checkAvailability: vi.fn().mockResolvedValue({ available: true, reason: null }),
    };

    mockTableRepository = {
      findByFilters: vi.fn().mockResolvedValue([]),
    };

    mockTableGroupRepository = {
      findByFilters: vi.fn().mockResolvedValue([]),
    };

    mockReservationRepository = {
      findByFilters: vi.fn().mockResolvedValue([]),
    };

    engine = new AutoAssignmentEngine({
      availabilityService: mockAvailabilityService,
      tableRepository: mockTableRepository,
      tableGroupRepository: mockTableGroupRepository,
      reservationRepository: mockReservationRepository,
    });
  });

  it("assigns the best available table", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 4 }),
      createMockTable("table-2", { minimumCapacity: 4, maximumCapacity: 6 }),
    ]);

    const result = await engine.assign(defaultContext);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBeTruthy();
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns not_assigned when no tables exist", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([]);

    const result = await engine.assign(defaultContext);

    expect(result.status).toBe("not_assigned");
  });

  it("returns not_assigned when no tables have sufficient capacity", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 6, maximumCapacity: 8 }),
    ]);

    const result = await engine.assign(defaultContext);

    expect(result.status).toBe("not_assigned");
  });

  it("returns candidates via getCandidates", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 4 }),
    ]);

    const candidates = await engine.getCandidates(defaultContext);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.tableId).toBe("table-1");
  });

  it("assigns with a custom strategy", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 6 }),
      createMockTable("table-2", { minimumCapacity: 2, maximumCapacity: 4 }),
    ]);

    const bestFitStrategy = new BestFitAssignmentStrategy(
      engine.getScoringEngine(),
    );

    const result = await engine.assignWithStrategy(defaultContext, bestFitStrategy);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBe("table-2");
    expect(result.metadata?.strategy).toBe("best_fit");
  });

  it("prefers tables with better capacity fit", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 4 }),
      createMockTable("table-2", { minimumCapacity: 2, maximumCapacity: 8 }),
    ]);

    const result = await engine.assign(defaultContext);

    expect(result.tableId).toBe("table-1");
  });

  it("prefers available over unavailable tables", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 4 }),
      createMockTable("table-2", { minimumCapacity: 2, maximumCapacity: 4 }),
    ]);

    mockAvailabilityService.checkAvailability
      .mockResolvedValueOnce({ available: false, reason: "table_occupied" })
      .mockResolvedValueOnce({ available: true, reason: null });

    const result = await engine.assign(defaultContext);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBe("table-2");
  });

  it("prefers preferred dining area", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { diningAreaId: "area-1", minimumCapacity: 2, maximumCapacity: 4 }),
      createMockTable("table-2", { diningAreaId: "area-2", minimumCapacity: 2, maximumCapacity: 4 }),
    ]);

    const context = { ...defaultContext, preferredDiningAreaId: "area-2" };
    const result = await engine.assign(context);

    expect(result.tableId).toBe("table-2");
  });

  it("includes table groups as candidates when available", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 2 }),
      createMockTable("table-2", { minimumCapacity: 2, maximumCapacity: 2 }),
    ]);

    mockTableGroupRepository.findByFilters.mockResolvedValue([
      createMockGroup("group-1", ["table-1", "table-2"]),
    ]);

    const context = { ...defaultContext, partySize: 4 };
    const candidates = await engine.getCandidates(context);

    const groupCandidates = candidates.filter((c) => c.isTableGroup);
    expect(groupCandidates).toHaveLength(1);
  });

  it("exposes scoring engine for customization", () => {
    expect(engine.getScoringEngine()).toBeDefined();
    expect(engine.getCandidateGenerator()).toBeDefined();
    expect(engine.getDefaultStrategy()).toBeDefined();
  });
});
