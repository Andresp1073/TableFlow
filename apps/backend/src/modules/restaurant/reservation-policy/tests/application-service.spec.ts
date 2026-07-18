import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReservationPolicyApplicationService } from "../application/services/ReservationPolicyApplicationService.js";
import { ConcreteReservationPolicyFactory } from "../infrastructure/repositories/ConcreteReservationPolicyFactory.js";
import type { ReservationPolicyRepository } from "../domain/repositories/ReservationPolicyRepository.js";
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

function makeInMemoryRepository(): ReservationPolicyRepository {
  const store = new Map<string, ReservationPolicy>();

  return {
    findByRestaurantId: vi.fn(async (restaurantId: string) => {
      for (const p of store.values()) {
        if (p.restaurantId === restaurantId) return p;
      }
      return null;
    }),
    save: vi.fn(async (policy) => {
      store.set(policy.id, policy);
      return policy;
    }),
    update: vi.fn(async (policy) => {
      store.set(policy.id, policy);
      return policy;
    }),
  };
}

describe("ReservationPolicyApplicationService", () => {
  let service: ReservationPolicyApplicationService;
  let repository: ReservationPolicyRepository;
  let factory: ConcreteReservationPolicyFactory;
  let authService: AuthorizationService;
  let eventBus: EventBus;

  beforeEach(() => {
    repository = makeInMemoryRepository();
    factory = new ConcreteReservationPolicyFactory();
    authService = makeAuthService();
    eventBus = new EventBus();
    service = new ReservationPolicyApplicationService(
      repository,
      factory,
      authService,
      eventBus,
    );
  });

  describe("create", () => {
    it("creates policy with defaults", async () => {
      const result = await service.create(
        { restaurantId: "rest-1" },
        makeAuthContext(),
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(result.enabled).toBe(true);
      expect(result.minPartySize).toBe(1);
      expect(result.maxPartySize).toBe(20);
      expect(result.defaultReservationDuration).toBe(60);
      expect(result.minAdvanceBookingMinutes).toBe(60);
      expect(result.maxAdvanceBookingDays).toBe(30);
      expect(result.cancellationDeadlineMinutes).toBe(1440);
      expect(result.modificationDeadlineMinutes).toBe(1440);
      expect(result.allowWalkIns).toBe(true);
      expect(result.autoConfirmReservations).toBe(false);
      expect(result.requireCustomerPhone).toBe(false);
      expect(result.requireCustomerEmail).toBe(true);
      expect(result.maxActiveReservationsPerCustomer).toBe(10);
      expect(result.gracePeriodMinutes).toBe(15);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("creates policy with custom values", async () => {
      const result = await service.create(
        {
          restaurantId: "rest-2",
          enabled: false,
          minPartySize: 2,
          maxPartySize: 50,
          defaultReservationDuration: 90,
          minAdvanceBookingMinutes: 120,
          maxAdvanceBookingDays: 60,
          cancellationDeadlineMinutes: 720,
          modificationDeadlineMinutes: 360,
          allowWalkIns: false,
          autoConfirmReservations: true,
          requireCustomerPhone: true,
          requireCustomerEmail: false,
          maxActiveReservationsPerCustomer: 5,
          gracePeriodMinutes: 30,
        },
        makeAuthContext(),
      );

      expect(result.enabled).toBe(false);
      expect(result.minPartySize).toBe(2);
      expect(result.maxPartySize).toBe(50);
      expect(result.defaultReservationDuration).toBe(90);
      expect(result.minAdvanceBookingMinutes).toBe(120);
      expect(result.maxAdvanceBookingDays).toBe(60);
      expect(result.allowWalkIns).toBe(false);
      expect(result.autoConfirmReservations).toBe(true);
      expect(result.requireCustomerPhone).toBe(true);
      expect(result.requireCustomerEmail).toBe(false);
    });

    it("calls authorize with correct permission", async () => {
      await service.create({ restaurantId: "rest-3" }, makeAuthContext());
      expect(authService.authorize).toHaveBeenCalledWith(
        expect.anything(),
        "restaurants.reservation-policy.update",
      );
    });
  });

  describe("get", () => {
    it("returns policy by restaurant id", async () => {
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

    it("throws when policy not found", async () => {
      await expect(
        service.get({ restaurantId: "nonexistent" }, makeAuthContext()),
      ).rejects.toThrow("Reservation policy for restaurant 'nonexistent' not found");
    });
  });

  describe("update", () => {
    it("updates policy partially", async () => {
      await service.create({ restaurantId: "rest-1" }, makeAuthContext());

      const result = await service.update(
        { restaurantId: "rest-1", minPartySize: 2, maxPartySize: 10 },
        makeAuthContext(),
      );

      expect(result.minPartySize).toBe(2);
      expect(result.maxPartySize).toBe(10);
      expect(result.defaultReservationDuration).toBe(60);
      expect(result.allowWalkIns).toBe(true);
    });

    it("throws when updating non-existent policy", async () => {
      await expect(
        service.update({ restaurantId: "nonexistent" }, makeAuthContext()),
      ).rejects.toThrow("not found");
    });
  });

  describe("getOrCreate", () => {
    it("returns existing policy if present", async () => {
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

    it("creates new policy if not found", async () => {
      const result = await service.getOrCreate(
        { restaurantId: "rest-new" },
        makeAuthContext(),
      );

      expect(result.restaurantId).toBe("rest-new");
      expect(result.enabled).toBe(true);
      expect(result.minPartySize).toBe(1);
    });
  });
});
