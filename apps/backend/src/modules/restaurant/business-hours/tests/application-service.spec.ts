import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BusinessHours } from "../domain/models/BusinessHours.js";
import type { BusinessHoursRepository, BusinessHoursFactory } from "../domain/repositories/index.js";
import { BusinessHoursApplicationService } from "../application/services/BusinessHoursApplicationService.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";
import { DayOfWeek } from "../domain/models/DayOfWeek.js";
import { OpeningTime } from "../domain/models/OpeningTime.js";
import { ClosingTime } from "../domain/models/ClosingTime.js";
import { OpeningPeriod } from "../domain/models/OpeningPeriod.js";
import { DaySchedule } from "../domain/models/DaySchedule.js";

const mockAuthContext: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  permissions: ["restaurants.business-hours.read", "restaurants.business-hours.update"],
  role: "super-admin",
};

function createMockBusinessHours(overrides?: Partial<BusinessHours>): BusinessHours {
  const monday = DaySchedule.create(DayOfWeek.create(1), false, [
    OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
  ]);
  const tuesday = DaySchedule.create(DayOfWeek.create(2), false, [
    OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
  ]);
  const sunday = DaySchedule.create(DayOfWeek.create(7), true, []);

  return {
    id: "bh-1",
    restaurantId: "rest-1",
    schedules: [monday, tuesday, sunday],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("BusinessHoursApplicationService", () => {
  let repository: BusinessHoursRepository;
  let factory: BusinessHoursFactory;
  let authService: AuthorizationService;
  let eventBus: EventBus;
  let service: BusinessHoursApplicationService;

  beforeEach(() => {
    repository = {
      findByRestaurantId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    factory = {
      create: vi.fn().mockImplementation((data) => {
        const monday = DaySchedule.create(DayOfWeek.create(1), false, [
          OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
        ]);
        const sunday = DaySchedule.create(DayOfWeek.create(7), true, []);
        return {
          id: "new-bh-id",
          restaurantId: data.restaurantId,
          schedules: [monday, sunday],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
      reconstitute: vi.fn(),
    };

    authService = {
      authorize: vi.fn(),
      hasPermission: vi.fn(),
    };

    eventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    service = new BusinessHoursApplicationService(
      repository,
      factory,
      authService,
      eventBus,
    );
  });

  describe("get", () => {
    it("returns business hours by restaurant id", async () => {
      const mock = createMockBusinessHours();
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(mock);

      const result = await service.get({ restaurantId: "rest-1" }, mockAuthContext);

      expect(result.restaurantId).toBe("rest-1");
      expect(result.schedules).toHaveLength(3);
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.business-hours.read",
      );
    });

    it("throws when business hours not found", async () => {
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(null);

      await expect(
        service.get({ restaurantId: "rest-1" }, mockAuthContext),
      ).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("creates business hours with schedules", async () => {
      vi.mocked(repository.save).mockResolvedValue(createMockBusinessHours());

      const result = await service.create(
        {
          restaurantId: "rest-1",
          schedules: [
            {
              dayOfWeek: 1,
              isClosed: false,
              periods: [{ openTime: "08:00", closeTime: "12:00", order: 0 }],
            },
            {
              dayOfWeek: 7,
              isClosed: true,
              periods: [],
            },
          ],
        },
        mockAuthContext,
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.business-hours.update",
      );
    });

    it("calls authorize with correct permission", async () => {
      vi.mocked(repository.save).mockResolvedValue(createMockBusinessHours());

      await service.create(
        {
          restaurantId: "rest-1",
          schedules: [
            {
              dayOfWeek: 1,
              isClosed: false,
              periods: [{ openTime: "08:00", closeTime: "12:00", order: 0 }],
            },
          ],
        },
        mockAuthContext,
      );

      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.business-hours.update",
      );
    });
  });

  describe("update", () => {
    it("updates business hours", async () => {
      const existing = createMockBusinessHours();
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(existing);

      const updated = createMockBusinessHours({ schedules: [] });
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await service.update(
        {
          restaurantId: "rest-1",
          schedules: [
            {
              dayOfWeek: 1,
              isClosed: false,
              periods: [{ openTime: "09:00", closeTime: "17:00", order: 0 }],
            },
          ],
        },
        mockAuthContext,
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(repository.update).toHaveBeenCalled();
    });

    it("throws when updating non-existent hours", async () => {
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(null);

      await expect(
        service.update(
          {
            restaurantId: "rest-1",
            schedules: [],
          },
          mockAuthContext,
        ),
      ).rejects.toThrow();
    });
  });

  describe("getOrCreate", () => {
    it("returns existing business hours if present", async () => {
      const mock = createMockBusinessHours();
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(mock);

      const result = await service.getOrCreate(
        { restaurantId: "rest-1" },
        mockAuthContext,
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.business-hours.read",
      );
    });

    it("creates new business hours if not found", async () => {
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(null);
      vi.mocked(repository.save).mockResolvedValue(
        createMockBusinessHours({ id: "new-id" }),
      );

      const result = await service.getOrCreate(
        { restaurantId: "rest-1" },
        mockAuthContext,
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(factory.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
