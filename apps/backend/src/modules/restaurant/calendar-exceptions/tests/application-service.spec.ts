import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CalendarException } from "../domain/models/CalendarException.js";
import type { CalendarExceptionRepository, CalendarExceptionFactory } from "../domain/repositories/index.js";
import { CalendarExceptionApplicationService } from "../application/services/CalendarExceptionApplicationService.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";
import { ExceptionDate } from "../domain/models/ExceptionDate.js";
import { ExceptionType } from "../domain/models/ExceptionType.js";
import { Priority } from "../domain/models/Priority.js";

const mockAuthContext: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  permissions: [
    "restaurants.calendar-exceptions.read",
    "restaurants.calendar-exceptions.create",
    "restaurants.calendar-exceptions.update",
    "restaurants.calendar-exceptions.delete",
  ],
  role: "super-admin",
};

function createMockException(overrides?: Partial<CalendarException>): CalendarException {
  return {
    id: "ce-1",
    restaurantId: "rest-1",
    title: "Christmas Day",
    description: null,
    type: ExceptionType.reconstitute("holiday"),
    date: ExceptionDate.reconstitute("2026-12-25"),
    isClosed: true,
    openTime: null,
    closeTime: null,
    allDay: true,
    priority: Priority.reconstitute(90),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("CalendarExceptionApplicationService", () => {
  let repository: CalendarExceptionRepository;
  let factory: CalendarExceptionFactory;
  let authService: AuthorizationService;
  let eventBus: EventBus;
  let service: CalendarExceptionApplicationService;

  beforeEach(() => {
    repository = {
      findByRestaurantId: vi.fn(),
      findById: vi.fn(),
      findByRestaurantIdAndDate: vi.fn(),
      findByRestaurantIdAndDateRange: vi.fn(),
      findByDateAndType: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    factory = {
      create: vi.fn().mockImplementation((data) => ({
        id: "new-ce-id",
        restaurantId: data.restaurantId,
        title: data.title,
        description: data.description,
        type: data.type,
        date: data.date,
        isClosed: data.isClosed,
        openTime: data.openTime,
        closeTime: data.closeTime,
        allDay: data.allDay,
        priority: data.priority,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
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

    service = new CalendarExceptionApplicationService(
      repository,
      factory,
      authService,
      eventBus,
    );
  });

  describe("getAll", () => {
    it("returns all exceptions for a restaurant", async () => {
      const mock = [createMockException()];
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(mock);

      const result = await service.getAll({ restaurantId: "rest-1" }, mockAuthContext);

      expect(result).toHaveLength(1);
      expect(result[0].restaurantId).toBe("rest-1");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.calendar-exceptions.read",
      );
    });

    it("returns filtered exceptions by date range", async () => {
      const mock = [createMockException()];
      vi.mocked(repository.findByRestaurantIdAndDateRange).mockResolvedValue(mock);

      const result = await service.getAll(
        { restaurantId: "rest-1", startDate: "2026-12-01", endDate: "2026-12-31" },
        mockAuthContext,
      );

      expect(result).toHaveLength(1);
      expect(repository.findByRestaurantIdAndDateRange).toHaveBeenCalledWith(
        "rest-1",
        "2026-12-01",
        "2026-12-31",
      );
    });

    it("returns empty array when no exceptions exist", async () => {
      vi.mocked(repository.findByRestaurantId).mockResolvedValue([]);

      const result = await service.getAll({ restaurantId: "rest-1" }, mockAuthContext);

      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("creates a calendar exception", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().slice(0, 10);

      vi.mocked(repository.findByDateAndType).mockResolvedValue(null);
      vi.mocked(repository.save).mockResolvedValue(
        createMockException({ id: "new-id", date: ExceptionDate.reconstitute(dateStr) }),
      );

      const result = await service.create(
        {
          restaurantId: "rest-1",
          title: "New Year",
          type: "holiday",
          date: dateStr,
          isClosed: true,
          allDay: true,
        },
        mockAuthContext,
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.calendar-exceptions.create",
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        "CalendarExceptionCreated",
        expect.any(Object),
      );
    });

    it("throws when duplicate exception exists", async () => {
      vi.mocked(repository.findByDateAndType).mockResolvedValue(
        createMockException(),
      );

      await expect(
        service.create(
          {
            restaurantId: "rest-1",
            title: "Christmas",
            type: "holiday",
            date: "2026-12-25",
            isClosed: true,
            allDay: true,
          },
          mockAuthContext,
        ),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates an existing exception", async () => {
      const existing = createMockException();
      vi.mocked(repository.findById).mockResolvedValue(existing);
      vi.mocked(repository.update).mockResolvedValue({
        ...existing,
        title: "Updated Title",
      });

      const result = await service.update(
        {
          id: "ce-1",
          restaurantId: "rest-1",
          title: "Updated Title",
          type: "holiday",
          date: "2026-12-25",
          isClosed: true,
          allDay: true,
        },
        mockAuthContext,
      );

      expect(result.title).toBe("Updated Title");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.calendar-exceptions.update",
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        "CalendarExceptionUpdated",
        expect.any(Object),
      );
    });

    it("throws when updating non-existent exception", async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update(
          {
            id: "nonexistent",
            restaurantId: "rest-1",
            title: "Test",
            type: "holiday",
            date: "2026-12-25",
            isClosed: true,
            allDay: true,
          },
          mockAuthContext,
        ),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("deletes an existing exception", async () => {
      vi.mocked(repository.findById).mockResolvedValue(createMockException());

      await service.delete(
        { id: "ce-1", restaurantId: "rest-1" },
        mockAuthContext,
      );

      expect(repository.delete).toHaveBeenCalledWith("ce-1");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.calendar-exceptions.delete",
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        "CalendarExceptionDeleted",
        expect.any(Object),
      );
    });

    it("throws when deleting non-existent exception", async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.delete({ id: "nonexistent", restaurantId: "rest-1" }, mockAuthContext),
      ).rejects.toThrow();
    });
  });
});
