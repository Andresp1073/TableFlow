import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Restaurant } from "../../domain/models/Restaurant.js";
import type { RestaurantRepository } from "../../domain/repositories/RestaurantRepository.js";
import type { RestaurantSettingsRepository } from "../../settings/domain/repositories/RestaurantSettingsRepository.js";
import type { ReservationPolicyRepository } from "../../reservation-policy/domain/repositories/ReservationPolicyRepository.js";
import type { BusinessHoursRepository } from "../../business-hours/domain/repositories/BusinessHoursRepository.js";
import type { CalendarExceptionRepository } from "../../calendar-exceptions/domain/repositories/CalendarExceptionRepository.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { CacheProvider } from "../../../../shared/cache/domain/CacheProvider.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { RestaurantConfigurationResolver } from "../application/services/RestaurantConfigurationResolver.js";
import { RestaurantConfigurationService } from "../application/services/RestaurantConfigurationService.js";
import { RestaurantConfigurationMapper } from "../application/mappers/RestaurantConfigurationMapper.js";
import { RestaurantStatus } from "../../domain/models/RestaurantStatus.js";
import { RestaurantName } from "../../domain/models/RestaurantName.js";
import { RestaurantSlug } from "../../domain/models/RestaurantSlug.js";
import { RestaurantTimezone } from "../../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../../domain/models/RestaurantLanguage.js";

const mockAuthContext: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [],
  permissions: ["restaurants.read"],
  scope: { type: "organization", organizationId: "org-1" },
};

function createMockRestaurant(overrides?: Partial<Restaurant>): Restaurant {
  return {
    id: "rest-1",
    name: RestaurantName.reconstitute("Test Restaurant"),
    slug: RestaurantSlug.reconstitute("test-restaurant"),
    legalName: null,
    taxId: null,
    email: null,
    phone: null,
    website: null,
    logoUrl: null,
    address: null,
    status: RestaurantStatus.active(),
    timezone: RestaurantTimezone.reconstitute("America/New_York"),
    currency: RestaurantCurrency.reconstitute("USD"),
    language: RestaurantLanguage.reconstitute("en"),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-06-01"),
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function createMockResolverService(cache?: CacheProvider) {
  const restaurantRepo: RestaurantRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };

  const settingsRepo: RestaurantSettingsRepository = {
    findByRestaurantId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  const policyRepo: ReservationPolicyRepository = {
    findByRestaurantId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  const hoursRepo: BusinessHoursRepository = {
    findByRestaurantId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  const exceptionsRepo: CalendarExceptionRepository = {
    findByRestaurantId: vi.fn(),
    findById: vi.fn(),
    findByRestaurantIdAndDate: vi.fn(),
    findByRestaurantIdAndDateRange: vi.fn(),
    findByDateAndType: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const authService: AuthorizationService = {
    authorize: vi.fn(),
    authorizeScoped: vi.fn(),
    createContext: vi.fn(),
    getPermissions: vi.fn(),
    setEvaluator: vi.fn(),
  };

  return {
    restaurantRepo,
    settingsRepo,
    policyRepo,
    hoursRepo,
    exceptionsRepo,
    authService,
    resolver: new RestaurantConfigurationResolver(
      restaurantRepo,
      settingsRepo,
      policyRepo,
      hoursRepo,
      exceptionsRepo,
    ),
    service: new RestaurantConfigurationService(
      restaurantRepo,
      settingsRepo,
      policyRepo,
      hoursRepo,
      exceptionsRepo,
      authService,
      cache,
    ),
  };
}

describe("RestaurantConfigurationMapper", () => {
  it("maps a resolved configuration to DTO", () => {
    const restaurant = createMockRestaurant();
    const config = {
      restaurant,
      settings: null,
      reservationPolicy: null,
      businessHours: null,
      calendarExceptions: [],
    };

    const dto = RestaurantConfigurationMapper.toDTO(config);

    expect(dto.restaurant.id).toBe("rest-1");
    expect(dto.restaurant.name).toBe("Test Restaurant");
    expect(dto.restaurant.slug).toBe("test-restaurant");
    expect(dto.restaurant.status).toBe("active");
    expect(dto.restaurant.timezone).toBe("America/New_York");
    expect(dto.restaurant.currency).toBe("USD");
    expect(dto.restaurant.language).toBe("en");
    expect(dto.restaurant.isActive).toBe(true);
    expect(dto.settings).toBeNull();
    expect(dto.reservationPolicy).toBeNull();
    expect(dto.businessHours).toBeNull();
    expect(dto.calendarExceptions).toEqual([]);
    expect(dto.metadata.retrievedAt).toBeDefined();
    expect(dto.metadata.version).toBeDefined();
  });

  it("reports inactive for archived restaurant", () => {
    const restaurant = createMockRestaurant({ status: RestaurantStatus.archived() });
    const config = {
      restaurant,
      settings: null,
      reservationPolicy: null,
      businessHours: null,
      calendarExceptions: [],
    };

    const dto = RestaurantConfigurationMapper.toDTO(config);
    expect(dto.restaurant.isActive).toBe(false);
    expect(dto.restaurant.status).toBe("archived");
  });

  it("reports inactive for deleted restaurant", () => {
    const restaurant = createMockRestaurant({ deletedAt: new Date() });
    const config = {
      restaurant,
      settings: null,
      reservationPolicy: null,
      businessHours: null,
      calendarExceptions: [],
    };

    const dto = RestaurantConfigurationMapper.toDTO(config);
    expect(dto.restaurant.isActive).toBe(false);
  });
});

describe("RestaurantConfigurationResolver", () => {
  it("returns full configuration when all data exists", async () => {
    const { resolver, restaurantRepo, settingsRepo, policyRepo, hoursRepo, exceptionsRepo } = createMockResolverService();
    const restaurant = createMockRestaurant();

    vi.mocked(restaurantRepo.findById).mockResolvedValue(restaurant);
    vi.mocked(settingsRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(policyRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(hoursRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(exceptionsRepo.findByRestaurantId).mockResolvedValue([]);

    const result = await resolver.resolve("rest-1");

    expect(result.restaurant.id).toBe("rest-1");
    expect(result.settings).toBeNull();
    expect(result.reservationPolicy).toBeNull();
    expect(result.businessHours).toBeNull();
    expect(result.calendarExceptions).toEqual([]);
  });

  it("throws when restaurant is not found", async () => {
    const { resolver, restaurantRepo } = createMockResolverService();
    vi.mocked(restaurantRepo.findById).mockResolvedValue(null);

    await expect(resolver.resolve("nonexistent")).rejects.toThrow();
  });

  it("throws when restaurant is archived", async () => {
    const { resolver, restaurantRepo } = createMockResolverService();
    const restaurant = createMockRestaurant({ status: RestaurantStatus.archived() });
    vi.mocked(restaurantRepo.findById).mockResolvedValue(restaurant);

    await expect(resolver.resolve("rest-1")).rejects.toThrow("archived");
  });

  it("throws when restaurant is deleted", async () => {
    const { resolver, restaurantRepo } = createMockResolverService();
    const restaurant = createMockRestaurant({ deletedAt: new Date() });
    vi.mocked(restaurantRepo.findById).mockResolvedValue(restaurant);

    await expect(resolver.resolve("rest-1")).rejects.toThrow();
  });
});

describe("RestaurantConfigurationService", () => {
  it("returns configuration DTO", async () => {
    const { service, restaurantRepo, settingsRepo, policyRepo, hoursRepo, exceptionsRepo, authService } = createMockResolverService();
    const restaurant = createMockRestaurant();

    vi.mocked(restaurantRepo.findById).mockResolvedValue(restaurant);
    vi.mocked(settingsRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(policyRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(hoursRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(exceptionsRepo.findByRestaurantId).mockResolvedValue([]);
    vi.mocked(authService.authorize).mockResolvedValue(undefined);

    const result = await service.get({ restaurantId: "rest-1" }, mockAuthContext);

    expect(result.restaurant.id).toBe("rest-1");
    expect(result.restaurant.name).toBe("Test Restaurant");
  });

  it("checks authorization", async () => {
    const { service, authService } = createMockResolverService();
    vi.mocked(authService.authorize).mockRejectedValue(new Error("Unauthorized"));

    await expect(
      service.get({ restaurantId: "rest-1" }, mockAuthContext),
    ).rejects.toThrow("Unauthorized");

    expect(authService.authorize).toHaveBeenCalledWith(mockAuthContext, "restaurants.read");
  });

  it("bypasses cache on refresh", async () => {
    const cache: CacheProvider = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      deleteByPattern: vi.fn(),
      exists: vi.fn(),
      getStats: vi.fn(),
      dispose: vi.fn(),
    };

    const { service, restaurantRepo, settingsRepo, policyRepo, hoursRepo, exceptionsRepo, authService } = createMockResolverService(cache);
    const restaurant = createMockRestaurant();

    vi.mocked(restaurantRepo.findById).mockResolvedValue(restaurant);
    vi.mocked(settingsRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(policyRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(hoursRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(exceptionsRepo.findByRestaurantId).mockResolvedValue([]);
    vi.mocked(authService.authorize).mockResolvedValue(undefined);

    await service.refresh({ restaurantId: "rest-1" }, mockAuthContext);

    expect(cache.delete).toHaveBeenCalledWith("restaurant:config:rest-1");
    expect(cache.set).toHaveBeenCalledWith(
      "restaurant:config:rest-1",
      expect.objectContaining({ restaurant: expect.objectContaining({ id: "rest-1" }) }),
      expect.any(Number),
    );
  });

  it("returns cached result when available", async () => {
    const cachedDTO = {
      restaurant: { id: "rest-1", name: "Cached" },
      settings: null,
      reservationPolicy: null,
      businessHours: null,
      calendarExceptions: [],
      metadata: { retrievedAt: new Date().toISOString(), version: "abc" },
    } as never;

    const cache: CacheProvider = {
      get: vi.fn().mockResolvedValue(cachedDTO),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      deleteByPattern: vi.fn(),
      exists: vi.fn(),
      getStats: vi.fn(),
      dispose: vi.fn(),
    };

    const { service, restaurantRepo } = createMockResolverService(cache);

    const result = await service.get({ restaurantId: "rest-1" }, mockAuthContext);

    expect(result.restaurant.name).toBe("Cached");
    expect(restaurantRepo.findById).not.toHaveBeenCalled();
  });

  it("populates cache on first request", async () => {
    const cache: CacheProvider = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      deleteByPattern: vi.fn(),
      exists: vi.fn(),
      getStats: vi.fn(),
      dispose: vi.fn(),
    };

    const { service, restaurantRepo, settingsRepo, policyRepo, hoursRepo, exceptionsRepo, authService } = createMockResolverService(cache);
    const restaurant = createMockRestaurant();

    vi.mocked(restaurantRepo.findById).mockResolvedValue(restaurant);
    vi.mocked(settingsRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(policyRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(hoursRepo.findByRestaurantId).mockResolvedValue(null);
    vi.mocked(exceptionsRepo.findByRestaurantId).mockResolvedValue([]);
    vi.mocked(authService.authorize).mockResolvedValue(undefined);

    await service.get({ restaurantId: "rest-1" }, mockAuthContext);

    expect(cache.set).toHaveBeenCalled();
  });
});
