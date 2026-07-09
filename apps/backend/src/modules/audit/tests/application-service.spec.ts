import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditApplicationService } from "../application/services/AuditApplicationService.js";
import type { AuditRepository, PaginatedResult } from "../domain/repositories/AuditRepository.js";
import type { AuditFactory } from "../domain/repositories/AuditFactory.js";
import { ConcreteAuditFactory } from "../infrastructure/repositories/ConcreteAuditFactory.js";
import { AuditAction } from "../domain/models/AuditAction.js";
import { AuditModule } from "../domain/models/AuditModule.js";
import { AuditEntryNotFoundError } from "../errors/AuditEntryNotFoundError.js";
import { EventBus } from "../../../events/EventBus.js";
import type { AuditEntry } from "../domain/models/AuditEntry.js";

function createMockEntry(overrides?: Partial<AuditEntry>): AuditEntry {
  const factory = new ConcreteAuditFactory();
  return factory.create({
    organizationId: "org-1",
    module: AuditModule.create("restaurant"),
    entityType: "restaurant",
    entityId: "entity-1",
    action: AuditAction.create("create"),
    performedBy: "user-1",
    restaurantId: "rest-1",
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
    requestId: "req-1",
    oldValues: null,
    newValues: { name: "Test" },
    metadata: null,
    ...overrides,
  });
}

describe("AuditApplicationService", () => {
  let repository: AuditRepository;
  let factory: AuditFactory;
  let eventBus: EventBus;
  let service: AuditApplicationService;

  beforeEach(() => {
    const mockEntry = createMockEntry();

    repository = {
      save: vi.fn().mockResolvedValue(mockEntry),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === "existing-id") return Promise.resolve(mockEntry);
        return Promise.resolve(null);
      }),
      search: vi.fn().mockResolvedValue({
        items: [mockEntry],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      } as PaginatedResult<AuditEntry>),
      findByOrganizationAndDateRange: vi.fn().mockResolvedValue({
        items: [mockEntry],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      } as PaginatedResult<AuditEntry>),
    };

    factory = new ConcreteAuditFactory();
    eventBus = new EventBus();
    service = new AuditApplicationService(repository, factory, eventBus);
  });

  describe("record", () => {
    it("records an audit entry", async () => {
      await service.record({
        organizationId: "org-1",
        module: "restaurant",
        entityType: "restaurant",
        entityId: "entity-1",
        action: "create",
        performedBy: "user-1",
        restaurantId: "rest-1",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
        requestId: "req-1",
        newValues: { name: "Test" },
      });

      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it("throws for invalid action", async () => {
      await expect(service.record({
        organizationId: "org-1",
        module: "restaurant",
        entityType: "restaurant",
        entityId: "entity-1",
        action: "invalid_action",
      })).rejects.toThrow();
    });

    it("throws for invalid module", async () => {
      await expect(service.record({
        organizationId: "org-1",
        module: "invalid_module",
        entityType: "restaurant",
        entityId: "entity-1",
        action: "create",
      })).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("returns an audit entry by ID", async () => {
      const result = await service.getById({
        id: "existing-id",
        organizationId: "org-1",
      });

      expect(result.id).toBeDefined();
      expect(result.action).toBe("create");
      expect(result.module).toBe("restaurant");
    });

    it("throws for non-existent entry", async () => {
      await expect(service.getById({
        id: "non-existent",
        organizationId: "org-1",
      })).rejects.toThrow(AuditEntryNotFoundError);
    });
  });

  describe("search", () => {
    it("returns paginated results", async () => {
      const result = await service.search({
        organizationId: "org-1",
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("filters by module", async () => {
      await service.search({
        organizationId: "org-1",
        module: "restaurant",
      });

      expect(repository.search).toHaveBeenCalledWith(
        expect.objectContaining({ module: "restaurant" }),
      );
    });

    it("filters by action", async () => {
      await service.search({
        organizationId: "org-1",
        action: "create",
      });

      expect(repository.search).toHaveBeenCalledWith(
        expect.objectContaining({ action: "create" }),
      );
    });
  });
});
