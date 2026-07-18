import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthorizationService } from "../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../events/EventBus.js";
import type { RestaurantRepository } from "../domain/repositories/RestaurantRepository.js";
import type { RestaurantQueryRepository } from "../domain/repositories/RestaurantQueryRepository.js";
import type { RestaurantFactory } from "../domain/repositories/RestaurantFactory.js";
import { RestaurantUniquenessValidator, type UniquenessRepository } from "../domain/services/RestaurantUniquenessValidator.js";
import { RestaurantStatusPolicy } from "../domain/rules/RestaurantStatusPolicy.js";
import { RestaurantApplicationService } from "../application/services/RestaurantApplicationService.js";
import { ConcreteRestaurantFactory } from "../infrastructure/repositories/ConcreteRestaurantFactory.js";
import { PrismaRestaurantQueryRepository } from "../infrastructure/repositories/PrismaRestaurantQueryRepository.js";
import type { Restaurant } from "../domain/models/Restaurant.js";
import { RestaurantName } from "../domain/models/RestaurantName.js";
import { RestaurantSlug } from "../domain/models/RestaurantSlug.js";
import { RestaurantStatus } from "../domain/models/RestaurantStatus.js";
import { RestaurantTimezone } from "../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../domain/models/RestaurantLanguage.js";
import { RestaurantEmail } from "../domain/models/RestaurantEmail.js";
import { RestaurantTaxId } from "../domain/models/RestaurantTaxId.js";
import { RestaurantPhone } from "../domain/models/RestaurantPhone.js";
import { RestaurantNotFoundError } from "../errors/RestaurantNotFoundError.js";

function makeAuthContext(overrides?: Partial<AuthorizationContext>): AuthorizationContext {
  return {
    userId: "user-1",
    organizationId: "org-1",
    roles: [],
    permissions: ["restaurants.create", "restaurants.read", "restaurants.update", "restaurants.archive", "restaurants.activate", "restaurants.suspend"],
    scope: { type: "organization", organizationId: "org-1" },
    ...overrides,
  };
}

function makeRestaurant(id: string, overrides?: Partial<Restaurant>): Restaurant {
  const now = new Date();
  return {
    id,
    name: RestaurantName.create("Test Restaurant"),
    slug: RestaurantSlug.create("test-restaurant"),
    legalName: null,
    taxId: null,
    email: null,
    phone: null,
    website: null,
    logoUrl: null,
    address: null,
    status: RestaurantStatus.draft(),
    timezone: RestaurantTimezone.create("UTC"),
    currency: RestaurantCurrency.create("USD"),
    language: RestaurantLanguage.create("en"),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function createMockRepository(): {
  repository: RestaurantRepository;
  queryRepository: RestaurantQueryRepository;
  prismaQueryRepository: PrismaRestaurantQueryRepository;
  store: Map<string, Restaurant>;
} {
  const store = new Map<string, Restaurant>();

  const repository: RestaurantRepository = {
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => {
      for (const r of store.values()) {
        if (r.slug.value === slug) return r;
      }
      return null;
    }),
    save: vi.fn(async (r: Restaurant) => {
      store.set(r.id, { ...r });
      return store.get(r.id)!;
    }),
    update: vi.fn(async (r: Restaurant) => {
      if (!store.has(r.id)) throw new RestaurantNotFoundError(r.id);
      store.set(r.id, { ...r });
      return store.get(r.id)!;
    }),
    softDelete: vi.fn(async (id: string) => {
      store.delete(id);
    }),
  };

  const queryRepository: RestaurantQueryRepository = {
    findAllActive: vi.fn(async () => []),
    findByStatus: vi.fn(async () => []),
    searchByName: vi.fn(async () => []),
    countByStatus: vi.fn(async () => ({ active: 0, inactive: 0, suspended: 0 } as never)),
  };

  return {
    repository,
    queryRepository,
    prismaQueryRepository: {} as PrismaRestaurantQueryRepository,
    store,
  };
}

function createMockUniquenessRepo(): UniquenessRepository {
  return {
    isSlugTaken: vi.fn(async () => false),
    isEmailTaken: vi.fn(async () => false),
    isTaxIdTaken: vi.fn(async () => false),
  };
}

function createMockAuthService(): AuthorizationService {
  return {
    authorize: vi.fn(async () => {}),
    authorizeScoped: vi.fn(async () => {}),
    createContext: vi.fn() as never,
    getPermissions: vi.fn() as never,
    hasPermission: vi.fn() as never,
  };
}

describe("RestaurantApplicationService", () => {
  let service: RestaurantApplicationService;
  let mockRepo: ReturnType<typeof createMockRepository>;
  let uniquenessRepo: UniquenessRepository;
  let authService: AuthorizationService;
  let bus: EventBus;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockRepository();
    uniquenessRepo = createMockUniquenessRepo();
    authService = createMockAuthService();
    bus = new EventBus();

    service = new RestaurantApplicationService(
      mockRepo.repository,
      mockRepo.queryRepository,
      mockRepo.prismaQueryRepository,
      new ConcreteRestaurantFactory(),
      new RestaurantUniquenessValidator(uniquenessRepo),
      new RestaurantStatusPolicy(),
      authService,
      bus,
    );
  });

  describe("create", () => {
    it("creates a restaurant successfully", async () => {
      const result = await service.create(
        { name: "New Restaurant", slug: "new-restaurant" },
        makeAuthContext(),
      );

      expect(result.name).toBe("New Restaurant");
      expect(result.slug).toBe("new-restaurant");
      expect(result.status).toBe("draft");
      expect(result.id).toBeDefined();
      expect(authService.authorize).toHaveBeenCalledWith(
        expect.anything(),
        "restaurants.create",
      );
    });

    it("rejects duplicate slug", async () => {
      uniquenessRepo.isSlugTaken = vi.fn(async () => true);

      await expect(
        service.create({ name: "Test", slug: "taken-slug" }, makeAuthContext()),
      ).rejects.toThrow();
    });

    it("rejects invalid name", async () => {
      await expect(
        service.create({ name: "", slug: "test" }, makeAuthContext()),
      ).rejects.toThrow("Validation failed");
    });

    it("emits RestaurantCreated event", async () => {
      const emitted: unknown[] = [];
      bus.on("RestaurantCreated", (e: unknown) => { emitted.push(e); });

      await service.create(
        { name: "Event Test", slug: "event-test" },
        makeAuthContext(),
      );

      expect(emitted).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("returns a restaurant by id", async () => {
      const r = makeRestaurant("rest-1");
      mockRepo.store.set("rest-1", r);

      const result = await service.getById({ id: "rest-1" }, makeAuthContext());

      expect(result.id).toBe("rest-1");
      expect(result.name).toBe("Test Restaurant");
      expect(authService.authorize).toHaveBeenCalledWith(
        expect.anything(),
        "restaurants.read",
      );
    });

    it("throws when restaurant not found", async () => {
      await expect(
        service.getById({ id: "non-existent" }, makeAuthContext()),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("update", () => {
    it("updates a restaurant successfully", async () => {
      const r = makeRestaurant("rest-1");
      mockRepo.store.set("rest-1", r);

      const result = await service.update(
        { id: "rest-1", name: "Updated Name" },
        makeAuthContext(),
      );

      expect(result.name).toBe("Updated Name");
      expect(authService.authorize).toHaveBeenCalledWith(
        expect.anything(),
        "restaurants.update",
      );
    });

    it("throws when updating non-existent restaurant", async () => {
      await expect(
        service.update({ id: "missing" }, makeAuthContext()),
      ).rejects.toThrow(/not found/i);
    });

    it("throws when updating archived restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.archived() });
      mockRepo.store.set("rest-1", r);

      await expect(
        service.update({ id: "rest-1", name: "New Name" }, makeAuthContext()),
      ).rejects.toThrow(/cannot modify an archived/i);
    });
  });

  describe("archive", () => {
    it("archives a draft restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.draft() });
      mockRepo.store.set("rest-1", r);

      const result = await service.archive(
        { id: "rest-1", deletedBy: "user-1" },
        makeAuthContext(),
      );

      expect(result.status).toBe("archived");
      expect(result.deletedAt).not.toBeNull();
    });

    it("throws when archiving active restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.active() });
      mockRepo.store.set("rest-1", r);

      await expect(
        service.archive({ id: "rest-1", deletedBy: "user-1" }, makeAuthContext()),
      ).rejects.toThrow(/only draft or inactive/i);
    });

    it("emits RestaurantArchived event", async () => {
      const emitted: unknown[] = [];
      bus.on("RestaurantArchived", (e: unknown) => { emitted.push(e); });
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.draft() });
      mockRepo.store.set("rest-1", r);

      await service.archive({ id: "rest-1", deletedBy: "user-1" }, makeAuthContext());

      expect(emitted).toHaveLength(1);
    });
  });

  describe("activate", () => {
    it("activates a pending restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.pending() });
      mockRepo.store.set("rest-1", r);

      const result = await service.activate({ id: "rest-1" }, makeAuthContext());

      expect(result.status).toBe("active");
    });

    it("activates an inactive restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.inactive() });
      mockRepo.store.set("rest-1", r);

      const result = await service.activate({ id: "rest-1" }, makeAuthContext());

      expect(result.status).toBe("active");
    });

    it("throws when activating an active restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.active() });
      mockRepo.store.set("rest-1", r);

      await expect(
        service.activate({ id: "rest-1" }, makeAuthContext()),
      ).rejects.toThrow(/only draft, pending, or inactive/i);
    });
  });

  describe("suspend", () => {
    it("suspends an active restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.active() });
      mockRepo.store.set("rest-1", r);

      const result = await service.suspend({ id: "rest-1" }, makeAuthContext());

      expect(result.status).toBe("suspended");
    });

    it("throws when suspending a draft restaurant", async () => {
      const r = makeRestaurant("rest-1", { status: RestaurantStatus.draft() });
      mockRepo.store.set("rest-1", r);

      await expect(
        service.suspend({ id: "rest-1" }, makeAuthContext()),
      ).rejects.toThrow(/only active/i);
    });
  });

  describe("authorization integration", () => {
    it("throws when missing restaurants.create permission", async () => {
      const noPermAuth = makeAuthContext({ permissions: [] });
      authService.authorize = vi.fn(async () => {
        throw new Error("Forbidden");
      });

      await expect(
        service.create({ name: "Test", slug: "test" }, noPermAuth),
      ).rejects.toThrow("Forbidden");
    });

    it("throws when missing restaurants.read permission", async () => {
      authService.authorize = vi.fn(async () => {
        throw new Error("Forbidden");
      });

      await expect(
        service.getById({ id: "rest-1" }, makeAuthContext()),
      ).rejects.toThrow("Forbidden");
    });
  });
});
