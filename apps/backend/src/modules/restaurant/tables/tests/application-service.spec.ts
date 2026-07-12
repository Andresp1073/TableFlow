import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TableRepository } from "../domain/repositories/TableRepository.js";
import type { TableFactory } from "../domain/repositories/TableFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { TableApplicationService } from "../application/services/TableApplicationService.js";
import { ConcreteTableFactory } from "../infrastructure/repositories/ConcreteTableFactory.js";
import { EventBus } from "../../../../events/EventBus.js";
import { TableStatus } from "../domain/models/TableStatus.js";
import type { Table } from "../domain/models/Table.js";
import { TableNotFoundError } from "../errors/TableNotFoundError.js";

const mockAuth: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [],
  permissions: [],
  scope: { type: "organization", organizationId: "org-1" },
};

function createMockTable(overrides?: Partial<Table>): Table {
  const factory = new ConcreteTableFactory();
  const base = factory.create({
    restaurantId: "rest-1",
    branchId: "branch-1",
    tableNumber: { value: "T1" } as any,
    minimumCapacity: { value: 2 } as any,
    maximumCapacity: { value: 4 } as any,
  });
  Object.assign(base, { id: "table-1", ...overrides });
  return base;
}

describe("TableApplicationService", () => {
  let repository: TableRepository;
  let factory: TableFactory;
  let eventBus: EventBus;
  let authService: AuthorizationService;
  let auditService: AuditService;
  let service: TableApplicationService;

  beforeEach(() => {
    const mockTable = createMockTable({ status: TableStatus.create("available") });

    repository = {
      save: vi.fn().mockResolvedValue(mockTable),
      update: vi.fn().mockResolvedValue(mockTable),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === "table-1") return Promise.resolve(mockTable);
        return Promise.resolve(null);
      }),
      findByIdAndRestaurant: vi.fn().mockImplementation((id: string) => {
        if (id === "table-1") return Promise.resolve(mockTable);
        return Promise.resolve(null);
      }),
      findByRestaurantId: vi.fn().mockResolvedValue([mockTable]),
      findByFilters: vi.fn().mockResolvedValue([mockTable]),
      findByNumberAndRestaurant: vi.fn().mockResolvedValue(null),
      findByNameAndRestaurant: vi.fn().mockResolvedValue(null),
      findByQrIdentifier: vi.fn().mockResolvedValue(null),
      countByDiningArea: vi.fn().mockResolvedValue(0),
      countByTableType: vi.fn().mockResolvedValue(0),
    } as TableRepository;

    factory = new ConcreteTableFactory();
    eventBus = new EventBus();
    authService = { authorize: vi.fn().mockResolvedValue(undefined), createContext: vi.fn() as never };
    auditService = { record: vi.fn().mockResolvedValue(undefined) };

    service = new TableApplicationService(repository, factory, authService, eventBus, auditService);
  });

  describe("changeStatus", () => {
    it("changes table status for valid transition", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("available") }),
      );
      const updated = createMockTable({ status: TableStatus.create("occupied") });
      repository.update = vi.fn().mockResolvedValue(updated);

      const result = await service.changeStatus(
        { id: "table-1", restaurantId: "rest-1", status: "occupied" },
        mockAuth,
      );

      expect(result.previousStatus).toBe("available");
      expect(result.newStatus).toBe("occupied");
      expect(result.id).toBe("table-1");
      expect(auditService.record).toHaveBeenCalledTimes(1);
    });

    it("throws TableNotFoundError for non-existent table", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(null);

      await expect(service.changeStatus(
        { id: "non-existent", restaurantId: "rest-1", status: "occupied" },
        mockAuth,
      )).rejects.toThrow(TableNotFoundError);
    });

    it("throws for invalid transition", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("cleaning") }),
      );

      await expect(service.changeStatus(
        { id: "table-1", restaurantId: "rest-1", status: "occupied" },
        mockAuth,
      )).rejects.toThrow("Cannot transition");
    });

    it("throws for archived table", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("archived") }),
      );

      await expect(service.changeStatus(
        { id: "table-1", restaurantId: "rest-1", status: "available" },
        mockAuth,
      )).rejects.toThrow("terminal");
    });

    it("throws for deleted table", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("available"), deletedAt: new Date() }),
      );

      await expect(service.changeStatus(
        { id: "table-1", restaurantId: "rest-1", status: "occupied" },
        mockAuth,
      )).rejects.toThrow("deleted");
    });

    it("throws for invalid status value", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("available") }),
      );

      await expect(service.changeStatus(
        { id: "table-1", restaurantId: "rest-1", status: "invalid" },
        mockAuth,
      )).rejects.toThrow("Invalid table status");
    });
  });

  describe("getAvailableTransitions", () => {
    it("returns allowed transitions for available", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("available") }),
      );

      const result = await service.getAvailableTransitions(
        { id: "table-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("available");
      expect(result.allowedTransitions).toEqual([
        "reserved", "occupied", "blocked", "maintenance", "cleaning",
      ]);
    });

    it("returns empty transitions for archived", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(
        createMockTable({ status: TableStatus.create("archived") }),
      );

      const result = await service.getAvailableTransitions(
        { id: "table-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("archived");
      expect(result.allowedTransitions).toEqual([]);
    });

    it("throws TableNotFoundError for non-existent table", async () => {
      repository.findByIdAndRestaurant = vi.fn().mockResolvedValue(null);

      await expect(service.getAvailableTransitions(
        { id: "non-existent", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow(TableNotFoundError);
    });
  });
});
