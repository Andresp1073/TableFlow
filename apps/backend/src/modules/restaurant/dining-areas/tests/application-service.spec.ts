import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiningAreaApplicationService } from "../application/services/DiningAreaApplicationService.js";
import type { DiningAreaRepository } from "../domain/repositories/DiningAreaRepository.js";
import type { DiningAreaFactory } from "../domain/repositories/DiningAreaFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { ConcreteDiningAreaFactory } from "../infrastructure/repositories/ConcreteDiningAreaFactory.js";
import { EventBus } from "../../../../events/EventBus.js";
import type { DiningArea } from "../domain/models/DiningArea.js";
import { DiningAreaName } from "../domain/models/DiningAreaName.js";
import { DiningAreaCode } from "../domain/models/DiningAreaCode.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";
import { DiningAreaStatus } from "../domain/models/DiningAreaStatus.js";
import { DiningAreaNotFoundError } from "../errors/DiningAreaNotFoundError.js";

const mockAuth: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [],
  permissions: [],
  scope: { type: "organization", organizationId: "org-1" },
};

function createMockArea(overrides?: Partial<DiningArea>): DiningArea {
  const factory = new ConcreteDiningAreaFactory();
  return factory.create({
    restaurantId: "rest-1",
    name: DiningAreaName.create("Main Hall"),
    code: DiningAreaCode.create("MAIN_HALL"),
    displayOrder: DisplayOrder.create(1),
    status: DiningAreaStatus.create("active"),
    isReservable: true,
    ...overrides,
  });
}

describe("DiningAreaApplicationService", () => {
  let repository: DiningAreaRepository;
  let factory: DiningAreaFactory;
  let eventBus: EventBus;
  let authService: AuthorizationService;
  let auditService: AuditService;
  let service: DiningAreaApplicationService;

  beforeEach(() => {
    const mockArea = createMockArea();

    repository = {
      save: vi.fn().mockResolvedValue(mockArea),
      update: vi.fn().mockResolvedValue(mockArea),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === "area-1") return Promise.resolve(mockArea);
        return Promise.resolve(null);
      }),
      findByIdAndRestaurant: vi.fn().mockImplementation((id: string) => {
        if (id === "area-1") return Promise.resolve(mockArea);
        return Promise.resolve(null);
      }),
      findByRestaurantId: vi.fn().mockResolvedValue([mockArea]),
      findByNameAndRestaurant: vi.fn().mockResolvedValue(null),
      findByCodeAndRestaurant: vi.fn().mockResolvedValue(null),
      findMaxDisplayOrder: vi.fn().mockResolvedValue(0),
    };

    factory = new ConcreteDiningAreaFactory();
    eventBus = new EventBus();
    authService = { authorize: vi.fn().mockResolvedValue(undefined), createContext: vi.fn() as never };
    auditService = { record: vi.fn().mockResolvedValue(undefined) };

    service = new DiningAreaApplicationService(
      repository,
      factory,
      authService,
      eventBus,
      auditService,
    );
  });

  describe("create", () => {
    it("creates a dining area", async () => {
      const result = await service.create(
        { restaurantId: "rest-1", name: "Main Hall", code: "MAIN_HALL" },
        mockAuth,
      );

      expect(result.name).toBe("Main Hall");
      expect(result.code).toBe("MAIN_HALL");
      expect(result.status).toBe("active");
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledTimes(1);
    });

    it("throws for duplicate name", async () => {
      const existing = createMockArea();
      repository.findByNameAndRestaurant = vi.fn().mockResolvedValue(existing);

      await expect(service.create(
        { restaurantId: "rest-1", name: "Main Hall", code: "MAIN_HALL" },
        mockAuth,
      )).rejects.toThrow("already exists");
    });

    it("throws for duplicate code", async () => {
      const existing = createMockArea();
      repository.findByCodeAndRestaurant = vi.fn().mockResolvedValue(existing);

      await expect(service.create(
        { restaurantId: "rest-1", name: "Other Hall", code: "MAIN_HALL" },
        mockAuth,
      )).rejects.toThrow("already exists");
    });
  });

  describe("getById", () => {
    it("returns a dining area by ID", async () => {
      const result = await service.getById(
        { id: "area-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.name).toBe("Main Hall");
    });

    it("throws for non-existent area", async () => {
      await expect(service.getById(
        { id: "non-existent", restaurantId: "rest-1" },
        mockAuth,
      )).rejects.toThrow(DiningAreaNotFoundError);
    });
  });

  describe("list", () => {
    it("returns all areas for a restaurant", async () => {
      const result = await service.list(
        { restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result).toHaveLength(1);
    });
  });

  describe("archive", () => {
    it("archives an active area", async () => {
      const archivedArea = createMockArea({ status: DiningAreaStatus.create("archived") });
      repository.update = vi.fn().mockResolvedValue(archivedArea);

      const result = await service.archive(
        { id: "area-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("archived");
      expect(auditService.record).toHaveBeenCalled();
    });
  });
});
