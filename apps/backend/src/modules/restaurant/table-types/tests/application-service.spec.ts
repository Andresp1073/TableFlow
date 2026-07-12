import { describe, it, expect, vi, beforeEach } from "vitest";
import { TableTypeApplicationService } from "../application/services/TableTypeApplicationService.js";
import type { TableTypeRepository } from "../domain/repositories/TableTypeRepository.js";
import type { TableTypeFactory } from "../domain/repositories/TableTypeFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { ConcreteTableTypeFactory } from "../infrastructure/repositories/ConcreteTableTypeFactory.js";
import { EventBus } from "../../../../events/EventBus.js";
import type { TableType } from "../domain/models/TableType.js";
import { TableTypeName } from "../domain/models/TableTypeName.js";
import { TableTypeCode } from "../domain/models/TableTypeCode.js";
import { TableCapacity } from "../domain/models/TableCapacity.js";
import { TableShape } from "../domain/models/TableShape.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";
import { TableTypeStatus } from "../domain/models/TableTypeStatus.js";
import { TableTypeNotFoundError } from "../errors/TableTypeNotFoundError.js";

const mockAuth: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [],
  permissions: [],
  scope: { type: "organization", organizationId: "org-1" },
};

function createMockTableType(overrides?: Partial<TableType>): TableType {
  const factory = new ConcreteTableTypeFactory();
  return factory.create({
    restaurantId: "rest-1",
    name: TableTypeName.create("Standard"),
    code: TableTypeCode.create("STANDARD"),
    description: null,
    defaultCapacity: TableCapacity.create(4),
    minimumCapacity: TableCapacity.create(1),
    maximumCapacity: TableCapacity.create(8),
    shape: TableShape.create("rectangle"),
    isReservable: true,
    displayOrder: DisplayOrder.create(1),
    status: TableTypeStatus.create("active"),
    metadata: null,
    ...overrides,
  });
}

describe("TableTypeApplicationService", () => {
  let repository: TableTypeRepository;
  let factory: TableTypeFactory;
  let eventBus: EventBus;
  let authService: AuthorizationService;
  let auditService: AuditService;
  let service: TableTypeApplicationService;

  beforeEach(() => {
    const mockTableType = createMockTableType();

    repository = {
      save: vi.fn().mockResolvedValue(mockTableType),
      update: vi.fn().mockImplementation((updated: TableType) => Promise.resolve(updated)),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === "type-1") return Promise.resolve(mockTableType);
        return Promise.resolve(null);
      }),
      findByIdAndRestaurant: vi.fn().mockImplementation((id: string) => {
        if (id === "type-1") return Promise.resolve(mockTableType);
        return Promise.resolve(null);
      }),
      findByRestaurantId: vi.fn().mockResolvedValue([mockTableType]),
      findByNameAndRestaurant: vi.fn().mockResolvedValue(null),
      findByCodeAndRestaurant: vi.fn().mockResolvedValue(null),
      findMaxDisplayOrder: vi.fn().mockResolvedValue(0),
    };

    factory = new ConcreteTableTypeFactory();
    eventBus = new EventBus();
    authService = { authorize: vi.fn().mockResolvedValue(undefined), createContext: vi.fn() as never };
    auditService = { record: vi.fn().mockResolvedValue(undefined) };

    service = new TableTypeApplicationService(
      repository,
      factory,
      authService,
      eventBus,
      auditService,
    );
  });

  describe("create", () => {
    it("creates a table type", async () => {
      const result = await service.create(
        {
          restaurantId: "rest-1",
          name: "Standard",
          code: "STANDARD",
          defaultCapacity: 4,
          minimumCapacity: 1,
          maximumCapacity: 8,
          shape: "rectangle",
        },
        mockAuth,
      );

      expect(result.name).toBe("Standard");
      expect(result.code).toBe("STANDARD");
      expect(result.status).toBe("active");
      expect(result.defaultCapacity).toBe(4);
      expect(result.minimumCapacity).toBe(1);
      expect(result.maximumCapacity).toBe(8);
      expect(result.shape).toBe("rectangle");
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledTimes(1);
    });

    it("throws for duplicate name", async () => {
      const existing = createMockTableType();
      repository.findByNameAndRestaurant = vi.fn().mockResolvedValue(existing);

      await expect(service.create(
        {
          restaurantId: "rest-1",
          name: "Standard",
          code: "STD",
          defaultCapacity: 4,
          minimumCapacity: 1,
          maximumCapacity: 8,
          shape: "rectangle",
        },
        mockAuth,
      )).rejects.toThrow("already exists");
    });

    it("throws for duplicate code", async () => {
      const existing = createMockTableType();
      repository.findByCodeAndRestaurant = vi.fn().mockResolvedValue(existing);

      await expect(service.create(
        {
          restaurantId: "rest-1",
          name: "Other",
          code: "STANDARD",
          defaultCapacity: 4,
          minimumCapacity: 1,
          maximumCapacity: 8,
          shape: "rectangle",
        },
        mockAuth,
      )).rejects.toThrow("already exists");
    });

    it("throws when minimum capacity exceeds default capacity", async () => {
      await expect(service.create(
        {
          restaurantId: "rest-1",
          name: "Test",
          code: "TEST",
          defaultCapacity: 2,
          minimumCapacity: 4,
          maximumCapacity: 8,
          shape: "rectangle",
        },
        mockAuth,
      )).rejects.toThrow("Minimum capacity must not exceed default capacity");
    });

    it("throws when default capacity exceeds maximum capacity", async () => {
      await expect(service.create(
        {
          restaurantId: "rest-1",
          name: "Test",
          code: "TEST",
          defaultCapacity: 10,
          minimumCapacity: 1,
          maximumCapacity: 8,
          shape: "rectangle",
        },
        mockAuth,
      )).rejects.toThrow("Default capacity must not exceed maximum capacity");
    });
  });

  describe("getById", () => {
    it("returns a table type by ID", async () => {
      const result = await service.getById(
        { id: "type-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.name).toBe("Standard");
    });

    it("throws for non-existent type", async () => {
      await expect(service.getById(
        { id: "non-existent", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow(TableTypeNotFoundError);
    });
  });

  describe("list", () => {
    it("returns all types for a restaurant", async () => {
      const result = await service.list(
        { restaurantId: "rest-1" },
        mockAuth,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Standard");
    });

    it("filters by status", async () => {
      repository.findByRestaurantId = vi.fn().mockResolvedValue([
        createMockTableType(),
        createMockTableType({
          name: TableTypeName.create("Archived Test"),
          code: TableTypeCode.create("ARCHIVED"),
          status: TableTypeStatus.create("archived"),
        }),
      ]);

      const result = await service.list(
        { restaurantId: "rest-1", status: "archived" },
        mockAuth,
      );

      expect(result.length).toBe(1);
      expect(result[0].status).toBe("archived");
    });
  });

  describe("archive", () => {
    it("archives a table type", async () => {
      const result = await service.archive(
        { id: "type-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("archived");
      expect(auditService.record).toHaveBeenCalledTimes(1);
    });

    it("throws for non-existent type", async () => {
      await expect(service.archive(
        { id: "non-existent", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow(TableTypeNotFoundError);
    });
  });
});
