import { describe, it, expect, beforeEach, vi } from "vitest";
import { RestaurantSettingsApplicationService } from "../application/services/RestaurantSettingsApplicationService.js";
import { ConcreteRestaurantSettingsFactory } from "../infrastructure/repositories/ConcreteRestaurantSettingsFactory.js";
import type { RestaurantSettingsRepository } from "../domain/repositories/RestaurantSettingsRepository.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";

function makeAuthContext(): AuthorizationContext {
  return {
    userId: "user-1",
    organizationId: "org-1",
    roles: [],
    permissions: [],
    isSuperAdmin: true,
  };
}

function makeAuthService(): AuthorizationService {
  return {
    authorize: vi.fn().mockResolvedValue(undefined),
    authorizeScoped: vi.fn().mockResolvedValue(undefined),
    createContext: vi.fn().mockResolvedValue(makeAuthContext()),
    getPermissions: vi.fn().mockResolvedValue([]),
  };
}

function makeInMemoryRepository(): RestaurantSettingsRepository {
  const store = new Map<string, import("../domain/models/RestaurantSettings.js").RestaurantSettings>();

  return {
    findByRestaurantId: vi.fn(async (restaurantId: string) => {
      for (const s of store.values()) {
        if (s.restaurantId === restaurantId) return s;
      }
      return null;
    }),
    save: vi.fn(async (settings) => {
      store.set(settings.id, settings);
      return settings;
    }),
    update: vi.fn(async (settings) => {
      store.set(settings.id, settings);
      return settings;
    }),
  };
}

describe("RestaurantSettingsApplicationService", () => {
  let service: RestaurantSettingsApplicationService;
  let repository: RestaurantSettingsRepository;
  let factory: ConcreteRestaurantSettingsFactory;
  let authService: AuthorizationService;
  let eventBus: EventBus;

  beforeEach(() => {
    repository = makeInMemoryRepository();
    factory = new ConcreteRestaurantSettingsFactory();
    authService = makeAuthService();
    eventBus = new EventBus();
    service = new RestaurantSettingsApplicationService(
      repository,
      factory,
      authService,
      eventBus,
    );
  });

  describe("create", () => {
    it("creates settings with defaults", async () => {
      const result = await service.create(
        { restaurantId: "rest-1" },
        makeAuthContext(),
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(result.timezone).toBe("UTC");
      expect(result.currency).toBe("USD");
      expect(result.language).toBe("en");
      expect(result.dateFormat).toBe("YYYY-MM-DD");
      expect(result.timeFormat).toBe("HH:mm");
      expect(result.weekStartsOn).toBe(0);
      expect(result.taxPercentage).toBe(0);
      expect(result.serviceChargePercentage).toBe(0);
      expect(result.defaultReservationDuration).toBe(60);
      expect(result.reservationBufferMinutes).toBe(15);
      expect(result.allowWalkIns).toBe(true);
      expect(result.autoConfirmReservations).toBe(false);
      expect(result.maxReservationsPerCustomer).toBe(10);
      expect(result.reservationCancellationHours).toBe(24);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("creates settings with custom values", async () => {
      const result = await service.create(
        {
          restaurantId: "rest-2",
          timezone: "America/New_York",
          currency: "EUR",
          language: "fr",
          dateFormat: "DD/MM/YYYY",
          timeFormat: "hh:mm A",
          weekStartsOn: 1,
          taxPercentage: 8.5,
          serviceChargePercentage: 5,
          defaultReservationDuration: 90,
          reservationBufferMinutes: 30,
          allowWalkIns: false,
          autoConfirmReservations: true,
          maxReservationsPerCustomer: 5,
          reservationCancellationHours: 48,
        },
        makeAuthContext(),
      );

      expect(result.timezone).toBe("America/New_York");
      expect(result.currency).toBe("EUR");
      expect(result.language).toBe("fr");
      expect(result.dateFormat).toBe("DD/MM/YYYY");
      expect(result.timeFormat).toBe("hh:mm A");
      expect(result.weekStartsOn).toBe(1);
      expect(result.taxPercentage).toBe(8.5);
      expect(result.defaultReservationDuration).toBe(90);
      expect(result.allowWalkIns).toBe(false);
      expect(result.autoConfirmReservations).toBe(true);
    });

    it("calls authorize with correct permission", async () => {
      await service.create({ restaurantId: "rest-3" }, makeAuthContext());
      expect(authService.authorize).toHaveBeenCalledWith(
        expect.anything(),
        "restaurants.settings.update",
      );
    });
  });

  describe("get", () => {
    it("returns settings by restaurant id", async () => {
      const created = await service.create(
        { restaurantId: "rest-1" },
        makeAuthContext(),
      );

      const result = await service.get(
        { restaurantId: "rest-1" },
        makeAuthContext(),
      );

      expect(result.id).toBe(created.id);
      expect(result.restaurantId).toBe("rest-1");
    });

    it("throws when settings not found", async () => {
      await expect(
        service.get({ restaurantId: "nonexistent" }, makeAuthContext()),
      ).rejects.toThrow("Settings for restaurant 'nonexistent' not found");
    });
  });

  describe("update", () => {
    it("updates settings partially", async () => {
      await service.create({ restaurantId: "rest-1" }, makeAuthContext());

      const result = await service.update(
        { restaurantId: "rest-1", timezone: "Europe/London", taxPercentage: 20 },
        makeAuthContext(),
      );

      expect(result.timezone).toBe("Europe/London");
      expect(result.taxPercentage).toBe(20);
      expect(result.currency).toBe("USD");
      expect(result.language).toBe("en");
    });

    it("throws when updating non-existent settings", async () => {
      await expect(
        service.update({ restaurantId: "nonexistent" }, makeAuthContext()),
      ).rejects.toThrow("not found");
    });
  });

  describe("getOrCreate", () => {
    it("returns existing settings if present", async () => {
      const created = await service.create(
        { restaurantId: "rest-1" },
        makeAuthContext(),
      );

      const result = await service.getOrCreate(
        { restaurantId: "rest-1" },
        makeAuthContext(),
      );

      expect(result.id).toBe(created.id);
    });

    it("creates new settings if not found", async () => {
      const result = await service.getOrCreate(
        { restaurantId: "rest-new" },
        makeAuthContext(),
      );

      expect(result.restaurantId).toBe("rest-new");
      expect(result.timezone).toBe("UTC");
    });
  });
});
