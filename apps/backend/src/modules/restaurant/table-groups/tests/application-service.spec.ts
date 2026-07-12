import { describe, it, expect, vi, beforeEach } from "vitest";
import { TableGroupApplicationService } from "../application/services/TableGroupApplicationService.js";
import type { TableGroupRepository } from "../domain/repositories/TableGroupRepository.js";
import type { TableGroupFactory } from "../domain/repositories/TableGroupFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { TableGroupCacheInvalidator } from "../application/services/TableGroupCacheInvalidator.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import type { TableGroup } from "../domain/models/TableGroup.js";
import { TableGroupId } from "../domain/models/TableGroupId.js";
import { TableGroupName } from "../domain/models/TableGroupName.js";
import { TableGroupStatus } from "../domain/models/TableGroupStatus.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";
import { EventBus } from "../../../../events/EventBus.js";
import { TableGroupNotFoundError } from "../errors/TableGroupNotFoundError.js";

const mockAuth: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [],
  permissions: [],
  scope: { type: "organization", organizationId: "org-1" },
};

function createMockGroup(overrides?: Partial<TableGroup>): TableGroup {
  return {
    id: TableGroupId.reconstitute("550e8400-e29b-41d4-a716-446655440000"),
    restaurantId: "rest-1",
    name: TableGroupName.create("Test Group"),
    description: null,
    status: TableGroupStatus.create("active"),
    isActive: true,
    createdBy: "user-1",
    members: [
      { tableId: "table-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
      { tableId: "table-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
    ],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    releasedAt: null,
    ...overrides,
  };
}

describe("TableGroupApplicationService", () => {
  let repository: TableGroupRepository;
  let factory: TableGroupFactory;
  let eventBus: EventBus;
  let authService: AuthorizationService;
  let auditService: AuditService;
  let cacheInvalidator: TableGroupCacheInvalidator;
  let service: TableGroupApplicationService;

  beforeEach(() => {
    const mockGroup = createMockGroup();

    repository = {
      save: vi.fn().mockResolvedValue(mockGroup),
      update: vi.fn().mockResolvedValue(mockGroup),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === "550e8400-e29b-41d4-a716-446655440000") return Promise.resolve(mockGroup);
        return Promise.resolve(null);
      }),
      findByIdAndRestaurant: vi.fn().mockImplementation((id: string) => {
        if (id === "550e8400-e29b-41d4-a716-446655440000") return Promise.resolve(mockGroup);
        return Promise.resolve(null);
      }),
      findByRestaurantId: vi.fn().mockResolvedValue([mockGroup]),
      findByFilters: vi.fn().mockResolvedValue([mockGroup]),
      findActiveGroupTableIds: vi.fn().mockResolvedValue([]),
      findActiveGroupByTableId: vi.fn().mockResolvedValue(null),
    };

    factory = {
      create: vi.fn().mockReturnValue(mockGroup),
      reconstitute: vi.fn().mockReturnValue(mockGroup),
    };

    eventBus = new EventBus();
    authService = { authorize: vi.fn().mockResolvedValue(undefined), createContext: vi.fn() as never };
    auditService = { record: vi.fn().mockResolvedValue(undefined) };
    cacheInvalidator = {
      invalidateOnCreate: vi.fn().mockResolvedValue(undefined),
      invalidateOnUpdate: vi.fn().mockResolvedValue(undefined),
      invalidateOnRelease: vi.fn().mockResolvedValue(undefined),
    };

    service = new TableGroupApplicationService(
      repository,
      factory,
      {
        findByIdAndRestaurant: vi.fn().mockImplementation((id: string) => {
          if (id === "table-1" || id === "table-2") {
            return Promise.resolve({
              id,
              restaurantId: "rest-1",
              status: { value: "available" },
              maximumCapacity: { value: 4 },
            });
          }
          return Promise.resolve(null);
        }),
      },
      authService,
      eventBus,
      auditService,
      cacheInvalidator,
    );
  });

  describe("create", () => {
    it("creates a table group", async () => {
      const result = await service.create(
        { restaurantId: "rest-1", name: "Test Group", tableIds: ["table-1", "table-2"] },
        mockAuth,
      );

      expect(result.name).toBe("Test Group");
      expect(result.status).toBe("active");
      expect(result.isActive).toBe(true);
      expect(result.members).toHaveLength(2);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(cacheInvalidator.invalidateOnCreate).toHaveBeenCalledTimes(1);
    });

    it("creates with optional description", async () => {
      const result = await service.create(
        { restaurantId: "rest-1", name: "Test Group", description: "Party area", tableIds: ["table-1", "table-2"] },
        mockAuth,
      );

      expect(result.name).toBe("Test Group");
      expect(auditService.record).toHaveBeenCalled();
    });

    it("throws for non-existent table", async () => {
      await expect(service.create(
        { restaurantId: "rest-1", name: "Test Group", tableIds: ["table-1", "table-3"] },
        mockAuth,
      )).rejects.toThrow("not found");
    });

    it("throws for insufficient tables", async () => {
      await expect(service.create(
        { restaurantId: "rest-1", name: "Test Group", tableIds: ["table-1"] },
        mockAuth,
      )).rejects.toThrow("at least 2 tables");
    });
  });

  describe("update", () => {
    it("updates a table group name", async () => {
      const updatedGroup = createMockGroup({ name: TableGroupName.create("Updated Group") });
      repository.update = vi.fn().mockResolvedValue(updatedGroup);

      const result = await service.update(
        { id: "550e8400-e29b-41d4-a716-446655440000", restaurantId: "rest-1", name: "Updated Group", updatedBy: "user-1" },
        mockAuth,
      );

      expect(result.name).toBe("Updated Group");
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(cacheInvalidator.invalidateOnUpdate).toHaveBeenCalledTimes(1);
    });

    it("throws for non-existent group", async () => {
      await expect(service.update(
        { id: "non-existent", restaurantId: "rest-1", name: "Updated", updatedBy: "user-1" },
        mockAuth,
      )).rejects.toThrow(TableGroupNotFoundError);
    });

    it("throws for terminal status", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockGroup({ status: TableGroupStatus.create("released") }),
      );

      await expect(service.update(
        { id: "550e8400-e29b-41d4-a716-446655440000", restaurantId: "rest-1", name: "Updated", updatedBy: "user-1" },
        mockAuth,
      )).rejects.toThrow("Cannot modify");
    });
  });

  describe("release", () => {
    it("releases an active table group", async () => {
      const releasedGroup = createMockGroup({
        status: TableGroupStatus.create("released"),
        isActive: false,
        releasedAt: new Date(),
      });
      repository.update = vi.fn().mockResolvedValue(releasedGroup);

      const result = await service.release(
        { id: "550e8400-e29b-41d4-a716-446655440000", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("released");
      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(cacheInvalidator.invalidateOnRelease).toHaveBeenCalledTimes(1);
    });

    it("throws for non-existent group", async () => {
      await expect(service.release(
        { id: "non-existent", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow(TableGroupNotFoundError);
    });

    it("throws already released", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockGroup({ status: TableGroupStatus.create("released") }),
      );

      await expect(service.release(
        { id: "550e8400-e29b-41d4-a716-446655440000", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow("Cannot modify");
    });
  });

  describe("getById", () => {
    it("returns a table group by ID", async () => {
      const result = await service.getById(
        { id: "550e8400-e29b-41d4-a716-446655440000", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.name).toBe("Test Group");
      expect(result.description).toBeNull();
      expect(result.isActive).toBe(true);
    });

    it("throws for non-existent group", async () => {
      await expect(service.getById(
        { id: "non-existent", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow(TableGroupNotFoundError);
    });
  });

  describe("list", () => {
    it("returns all groups for a restaurant", async () => {
      const result = await service.list(
        { restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result).toHaveLength(1);
      expect(result[0].memberCount).toBe(2);
    });

    it("filters by status", async () => {
      await service.list(
        { restaurantId: "rest-1", status: "active" },
        mockAuth,
      );

      expect(repository.findByFilters).toHaveBeenCalledWith({
        restaurantId: "rest-1",
        status: "active",
      });
    });
  });
});
