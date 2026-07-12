import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConcreteTableGroupFactory } from "../infrastructure/repositories/ConcreteTableGroupFactory.js";
import { PrismaTableGroupRepository } from "../infrastructure/repositories/PrismaTableGroupRepository.js";
import { TableGroupName } from "../domain/models/TableGroupName.js";
import { TableGroupStatus } from "../domain/models/TableGroupStatus.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";

describe("ConcreteTableGroupFactory", () => {
  const factory = new ConcreteTableGroupFactory();

  describe("create", () => {
    it("creates a new table group with default values", () => {
      const group = factory.create({
        restaurantId: "rest-1",
        name: TableGroupName.create("Test Group"),
        description: "A test description",
        status: TableGroupStatus.create("active"),
        createdBy: "user-1",
        members: [
          { tableId: "table-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
          { tableId: "table-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
        ],
      });

      expect(group.id).toBeDefined();
      expect(group.id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(group.restaurantId).toBe("rest-1");
      expect(group.name.value).toBe("Test Group");
      expect(group.description).toBe("A test description");
      expect(group.status.value).toBe("active");
      expect(group.isActive).toBe(true);
      expect(group.members).toHaveLength(2);
      expect(group.members[0].displayOrder.value).toBe(1);
      expect(group.members[1].tableId).toBe("table-2");
      expect(group.releasedAt).toBeNull();
    });

    it("defaults description to null", () => {
      const group = factory.create({
        restaurantId: "rest-1",
        name: TableGroupName.create("Test"),
        createdBy: "user-1",
        members: [
          { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
          { tableId: "t-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
        ],
      });

      expect(group.description).toBeNull();
    });

    it("defaults status to active", () => {
      const group = factory.create({
        restaurantId: "rest-1",
        name: TableGroupName.create("Test"),
        createdBy: "user-1",
        members: [
          { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
          { tableId: "t-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
        ],
      });

      expect(group.status.value).toBe("active");
    });
  });

  describe("reconstitute", () => {
    it("reconstitutes from stored data", () => {
      const joinedAt = new Date("2026-01-01");
      const group = factory.reconstitute({
        id: "550e8400-e29b-41d4-a716-446655440000",
        restaurantId: "rest-1",
        name: "Existing Group",
        description: "An existing group",
        status: "occupied",
        isActive: true,
        createdBy: "user-1",
        members: [
          { tableId: "t-1", displayOrder: 1, joinedAt },
          { tableId: "t-2", displayOrder: 2, joinedAt },
        ],
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
        releasedAt: null,
      });

      expect(group.id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(group.restaurantId).toBe("rest-1");
      expect(group.name.value).toBe("Existing Group");
      expect(group.description).toBe("An existing group");
      expect(group.status.value).toBe("occupied");
      expect(group.isActive).toBe(true);
      expect(group.members).toHaveLength(2);
      expect(group.members[0].displayOrder.value).toBe(1);
      expect(group.members[0].joinedAt).toEqual(joinedAt);
    });

    it("reconstitutes with no members", () => {
      const group = factory.reconstitute({
        id: "550e8400-e29b-41d4-a716-446655440000",
        restaurantId: "rest-1",
        name: "Empty Group",
        description: null,
        status: "released",
        isActive: false,
        createdBy: "user-1",
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        releasedAt: new Date(),
      });

      expect(group.members).toHaveLength(0);
      expect(group.status.value).toBe("released");
      expect(group.isActive).toBe(false);
    });
  });
});

describe("PrismaTableGroupRepository", () => {
  let mockPrisma: any;
  let mockFactory: ConcreteTableGroupFactory;
  let repository: PrismaTableGroupRepository;

  const mockGroupRecord: any = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    restaurantId: "rest-1",
    name: "Test Group",
    description: null,
    status: "active",
    isActive: true,
    createdBy: "user-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    releasedAt: null,
    members: [
      {
        id: "m-1",
        tableGroupId: "550e8400-e29b-41d4-a716-446655440000",
        tableId: "t-1",
        displayOrder: 1,
        joinedAt: new Date("2026-01-01"),
      },
      {
        id: "m-2",
        tableGroupId: "550e8400-e29b-41d4-a716-446655440000",
        tableId: "t-2",
        displayOrder: 2,
        joinedAt: new Date("2026-01-01"),
      },
    ],
  };

  beforeEach(() => {
    mockFactory = new ConcreteTableGroupFactory();

    mockPrisma = {
      tableGroup: {
        create: vi.fn().mockResolvedValue(mockGroupRecord),
        update: vi.fn().mockResolvedValue(mockGroupRecord),
        findUnique: vi.fn().mockImplementation(({ where: { id } }: any) => {
          if (id === "550e8400-e29b-41d4-a716-446655440000") return Promise.resolve(mockGroupRecord);
          return Promise.resolve(null);
        }),
        findFirst: vi.fn().mockImplementation(({ where }: any) => {
          if (where.id === "550e8400-e29b-41d4-a716-446655440000") return Promise.resolve(mockGroupRecord);
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockGroupRecord]),
      },
      tableGroupMember: {
        findFirst: vi.fn().mockImplementation(({ where }: any) => {
          if (where.tableId === "t-1") {
            return Promise.resolve({
              ...mockGroupRecord.members[0],
              tableGroup: mockGroupRecord,
            });
          }
          return Promise.resolve(null);
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    repository = new PrismaTableGroupRepository(mockPrisma, mockFactory);
  });

  describe("save", () => {
    it("creates a table group record", async () => {
      const group = mockFactory.create({
        restaurantId: "rest-1",
        name: TableGroupName.create("Test Group"),
        createdBy: "user-1",
        members: [
          { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
          { tableId: "t-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
        ],
      });

      const result = await repository.save(group);

      expect(result.restaurantId).toBe("rest-1");
      expect(mockPrisma.tableGroup.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("replaces members and updates the group", async () => {
      const group = mockFactory.reconstitute({
        id: "550e8400-e29b-41d4-a716-446655440000",
        restaurantId: "rest-1",
        name: "Updated Group",
        description: null,
        status: "active",
        isActive: true,
        createdBy: "user-1",
        members: [
          { tableId: "t-3", displayOrder: 1, joinedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        releasedAt: null,
      });

      const result = await repository.update(group);

      expect(mockPrisma.tableGroupMember.deleteMany).toHaveBeenCalledWith({
        where: { tableGroupId: "550e8400-e29b-41d4-a716-446655440000" },
      });
      expect(mockPrisma.tableGroup.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("returns a group when found", async () => {
      const result = await repository.findById("550e8400-e29b-41d4-a716-446655440000");
      expect(result).not.toBeNull();
      expect(result!.id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("returns null when not found", async () => {
      const result = await repository.findById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("findByIdAndRestaurant", () => {
    it("returns a group when found", async () => {
      const result = await repository.findByIdAndRestaurant(
        "550e8400-e29b-41d4-a716-446655440000",
        "rest-1",
      );
      expect(result).not.toBeNull();
      expect(result!.restaurantId).toBe("rest-1");
    });

    it("returns null when not found", async () => {
      const result = await repository.findByIdAndRestaurant("non-existent", "rest-1");
      expect(result).toBeNull();
    });
  });

  describe("findByRestaurantId", () => {
    it("returns all groups for a restaurant", async () => {
      const results = await repository.findByRestaurantId("rest-1");
      expect(results).toHaveLength(1);
    });
  });

  describe("findByFilters", () => {
    it("filters by status", async () => {
      await repository.findByFilters({ restaurantId: "rest-1", status: "active" });
      expect(mockPrisma.tableGroup.findMany).toHaveBeenCalled();
    });
  });

  describe("findActiveGroupTableIds", () => {
    it("returns active table IDs", async () => {
      const ids = await repository.findActiveGroupTableIds("rest-1");
      expect(ids).toEqual(["t-1", "t-2"]);
    });
  });

  describe("findActiveGroupByTableId", () => {
    it("returns active group when table is in one", async () => {
      const result = await repository.findActiveGroupByTableId("t-1");
      expect(result).not.toBeNull();
      expect(result!.members.some((m) => m.tableId === "t-1")).toBe(true);
    });

    it("returns null when table is not in any group", async () => {
      const result = await repository.findActiveGroupByTableId("t-99");
      expect(result).toBeNull();
    });
  });
});
