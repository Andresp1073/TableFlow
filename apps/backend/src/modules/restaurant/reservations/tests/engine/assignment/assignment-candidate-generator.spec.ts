import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssignmentCandidateGenerator } from "../../../engine/assignment/AssignmentCandidateGenerator.js";
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
    tableTypeId: overrides.tableTypeId === undefined ? "type-1" : (overrides.tableTypeId as string),
    tableNumber: { value: "T1" },
    name: { value: "Table 1" },
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
    isReservable: overrides.isReservable === undefined ? true : (overrides.isReservable as boolean),
    isAccessible: overrides.isAccessible === undefined ? false : (overrides.isAccessible as boolean),
    isActive: overrides.isActive === undefined ? true : (overrides.isActive as boolean),
    status: { value: "available" },
    metadata: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
  };
}

function createMockGroup(id: string, tableIds: string[], overrides: Record<string, unknown> = {}) {
  return {
    id: TableGroupId.reconstitute(id),
    restaurantId: "rest-1",
    name: { value: "Group 1" },
    description: null,
    status: { value: "active" },
    isActive: overrides.isActive === undefined ? true : (overrides.isActive as boolean),
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

function createMockReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? "res-1",
    restaurantId: "rest-1",
    reservationNumber: ReservationNumber.create("RES-001"),
    customerId: null,
    tableId: overrides.tableId ?? null,
    tableGroupId: null,
    date: ReservationDate.create(new Date("2026-07-14")),
    timeRange: ReservationTimeRange.create(
      new Date("2026-07-14T18:00:00Z"),
      new Date("2026-07-14T20:00:00Z"),
    ),
    partySize: PartySize.create(4),
    status: ReservationStatus.create((overrides.status as string) ?? "confirmed"),
    source: ReservationSource.create("website"),
    notes: null,
    specialRequests: null,
    createdBy: "user-1",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    cancelledAt: null,
  };
}

const defaultContext = {
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
};

describe("AssignmentCandidateGenerator", () => {
  let mockAvailabilityService: any;
  let mockTableRepository: any;
  let mockTableGroupRepository: any;
  let mockReservationRepository: any;
  let generator: AssignmentCandidateGenerator;

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

    generator = new AssignmentCandidateGenerator(
      mockAvailabilityService,
      mockTableRepository,
      mockTableGroupRepository,
      mockReservationRepository,
    );
  });

  it("generates candidates from available tables", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1"),
      createMockTable("table-2"),
    ]);

    const candidates = await generator.generate(defaultContext);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]?.tableId).toBe("table-1");
    expect(candidates[1]?.tableId).toBe("table-2");
    expect(candidates[0]?.isAvailable).toBe(true);
    expect(candidates[0]?.isTableGroup).toBe(false);
  });

  it("filters tables by party size capacity", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 1, maximumCapacity: 2 }),
      createMockTable("table-2", { minimumCapacity: 4, maximumCapacity: 8 }),
      createMockTable("table-3", { minimumCapacity: 6, maximumCapacity: 10 }),
    ]);

    const candidates = await generator.generate(defaultContext);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.tableId).toBe("table-2");
  });

  it("filters by preferred dining area", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { diningAreaId: "area-1" }),
      createMockTable("table-2", { diningAreaId: "area-2" }),
    ]);

    const context = { ...defaultContext, preferredDiningAreaId: "area-1" };
    const candidates = await generator.generate(context);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.tableId).toBe("table-1");
  });

  it("filters by accessibility requirement", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { isAccessible: false }),
      createMockTable("table-2", { isAccessible: true }),
    ]);

    const context = { ...defaultContext, isAccessibleRequired: true };
    const candidates = await generator.generate(context);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.tableId).toBe("table-2");
  });

  it("filters by preferred table type", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { tableTypeId: "type-1" }),
      createMockTable("table-2", { tableTypeId: "type-2" }),
    ]);

    const context = { ...defaultContext, preferredTableTypeId: "type-2" };
    const candidates = await generator.generate(context);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.tableId).toBe("table-2");
  });

  it("marks tables as unavailable when availability check fails", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1"),
    ]);

    mockAvailabilityService.checkAvailability.mockResolvedValue({
      available: false,
      reason: "table_occupied",
    });

    const candidates = await generator.generate(defaultContext);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.isAvailable).toBe(false);
    expect(candidates[0]?.availabilityReason).toBe("table_occupied");
  });

  it("detects overlapping reservations", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1"),
    ]);

    mockReservationRepository.findByFilters.mockResolvedValue([
      createMockReservation({ tableId: "table-1" }),
    ]);

    const candidates = await generator.generate(defaultContext);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.isAvailable).toBe(false);
    expect(candidates[0]?.availabilityReason).toBe("Table has overlapping reservation");
    expect(mockAvailabilityService.checkAvailability).not.toHaveBeenCalled();
  });

  it("excludes specified reservation from overlap check", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1"),
    ]);

    mockReservationRepository.findByFilters.mockResolvedValue([
      createMockReservation({ id: "res-to-exclude", tableId: "table-1" }),
    ]);

    const context = { ...defaultContext, excludeReservationId: "res-to-exclude" };
    const candidates = await generator.generate(context);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.isAvailable).toBe(true);
  });

  it("generates group candidates when groups exist", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 2 }),
      createMockTable("table-2", { minimumCapacity: 2, maximumCapacity: 2 }),
      createMockTable("table-3", { minimumCapacity: 2, maximumCapacity: 2 }),
    ]);

    mockTableGroupRepository.findByFilters.mockResolvedValue([
      createMockGroup("group-1", ["table-1", "table-2"]),
    ]);

    const context = { ...defaultContext, partySize: 4 };
    const candidates = await generator.generate(context);

    const groupCandidates = candidates.filter((c) => c.isTableGroup);
    expect(groupCandidates).toHaveLength(1);
    expect(groupCandidates[0]?.tableGroupId).toBe("group-1");
    expect(groupCandidates[0]?.minimumCapacity).toBe(4);
    expect(groupCandidates[0]?.maximumCapacity).toBe(4);
  });

  it("skips inactive groups", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 4 }),
    ]);

    mockTableGroupRepository.findByFilters.mockResolvedValue([
      createMockGroup("group-1", ["table-1"], { isActive: false }),
    ]);

    const candidates = await generator.generate(defaultContext);

    const groupCandidates = candidates.filter((c) => c.isTableGroup);
    expect(groupCandidates).toHaveLength(0);
  });

  it("skips groups with empty member list", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1", { minimumCapacity: 2, maximumCapacity: 4 }),
    ]);

    mockTableGroupRepository.findByFilters.mockResolvedValue([
      createMockGroup("group-1", []),
    ]);

    const candidates = await generator.generate(defaultContext);

    const groupCandidates = candidates.filter((c) => c.isTableGroup);
    expect(groupCandidates).toHaveLength(0);
  });

  it("returns empty when no tables fit", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([]);

    const candidates = await generator.generate(defaultContext);

    expect(candidates).toHaveLength(0);
  });

  it("calls findByFilters with correct parameters", async () => {
    mockTableRepository.findByFilters.mockResolvedValue([
      createMockTable("table-1"),
    ]);

    await generator.generate(defaultContext);

    expect(mockTableRepository.findByFilters).toHaveBeenCalledWith({
      restaurantId: "rest-1",
      isActive: true,
      isReservable: true,
    });
  });
});
