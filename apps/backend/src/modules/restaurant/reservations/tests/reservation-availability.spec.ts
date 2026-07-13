import { describe, it, expect, vi, beforeEach } from "vitest";
import { AvailabilityMapper } from "../application/services/AvailabilityMapper.js";
import { ReservationAvailabilityChecker } from "../application/services/ReservationAvailabilityChecker.js";
import { ReservationAvailabilityError } from "../errors/ReservationAvailabilityError.js";
import type { AvailabilityService, AvailabilityCheckResponse } from "../application/ports/AvailabilityService.js";

function createMockAvailabilityService(
  response?: AvailabilityCheckResponse,
): AvailabilityService {
  return {
    checkAvailability: vi.fn().mockResolvedValue(
      response ?? { available: true, reason: null },
    ),
  };
}

describe("AvailabilityMapper", () => {
  const mapper = new AvailabilityMapper();

  it("returns null for available result", () => {
    const error = mapper.mapToError({ available: true, reason: null });
    expect(error).toBeNull();
  });

  it("returns ReservationAvailabilityError for unavailable result", () => {
    const error = mapper.mapToError({
      available: false,
      reason: "restaurant_closed",
      metadata: { dayOfWeek: 3 },
    });

    expect(error).toBeInstanceOf(ReservationAvailabilityError);
    expect(error!.reason).toBe("restaurant_closed");
    expect(error!.metadata).toEqual({ dayOfWeek: 3 });
    expect(error!.message).toContain("restaurant_closed");
  });

  it("throws on ensureAvailable when unavailable", () => {
    expect(() =>
      mapper.ensureAvailable({
        available: false,
        reason: "table_occupied",
      }),
    ).toThrow(ReservationAvailabilityError);
  });

  it("does not throw on ensureAvailable when available", () => {
    expect(() =>
      mapper.ensureAvailable({ available: true, reason: null }),
    ).not.toThrow();
  });

  it("uses metadata message when present", () => {
    const error = mapper.mapToError({
      available: false,
      reason: "outside_business_hours",
      metadata: { message: "Restaurant is closed on Sundays" },
    });
    expect(error!.message).toBe("Restaurant is closed on Sundays");
  });

  it("handles null reason", () => {
    const error = mapper.mapToError({
      available: false,
      reason: null,
    });
    expect(error).toBeInstanceOf(ReservationAvailabilityError);
    expect(error!.reason).toBeNull();
  });
});

describe("ReservationAvailabilityChecker", () => {
  describe("checkBeforeCreate", () => {
    it("returns result when available", async () => {
      const service = createMockAvailabilityService({ available: true, reason: null });
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      const result = await checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
      });

      expect(result.available).toBe(true);
    });

    it("throws ReservationAvailabilityError when unavailable", async () => {
      const service = createMockAvailabilityService({
        available: false,
        reason: "restaurant_closed",
      });
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await expect(
        checker.checkBeforeCreate({
          restaurantId: "rest-1",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
        }),
      ).rejects.toThrow(ReservationAvailabilityError);
    });

    it("passes tableId to service when provided", async () => {
      const service = createMockAvailabilityService();
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
        tableId: "table-1",
      });

      expect(service.checkAvailability).toHaveBeenCalledWith(
        expect.objectContaining({ tableId: "table-1" }),
      );
    });

    it("passes diningAreaId and tableTypeId to service when provided", async () => {
      const service = createMockAvailabilityService();
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
        diningAreaId: "area-1",
        tableTypeId: "type-1",
      });

      expect(service.checkAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          diningAreaId: "area-1",
          tableTypeId: "type-1",
        }),
      );
    });
  });

  describe("checkBeforeConfirm", () => {
    it("checks availability for existing reservation", async () => {
      const service = createMockAvailabilityService({ available: true, reason: null });
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await checker.checkBeforeConfirm({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
      });

      expect(service.checkAvailability).toHaveBeenCalledOnce();
    });

    it("throws when availability check fails", async () => {
      const service = createMockAvailabilityService({
        available: false,
        reason: "table_occupied",
      });
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await expect(
        checker.checkBeforeConfirm({
          restaurantId: "rest-1",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
        }),
      ).rejects.toThrow(ReservationAvailabilityError);
    });
  });

  describe("checkBeforeUpdate", () => {
    it("uses updated fields when provided", async () => {
      const service = createMockAvailabilityService();
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await checker.checkBeforeUpdate({
        restaurantId: "rest-1",
        date: "2026-07-15",
        startTime: "2026-07-15T19:00:00Z",
        endTime: "2026-07-15T21:00:00Z",
        partySize: 6,
        existingDate: "2026-07-14T00:00:00Z",
        existingStartTime: "2026-07-14T18:00:00Z",
        existingEndTime: "2026-07-14T20:00:00Z",
        existingPartySize: 4,
      });

      expect(service.checkAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2026-07-15",
          startTime: "2026-07-15T19:00:00Z",
          endTime: "2026-07-15T21:00:00Z",
          partySize: 6,
        }),
      );
    });

    it("falls back to existing fields when updated fields not provided", async () => {
      const service = createMockAvailabilityService();
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await checker.checkBeforeUpdate({
        restaurantId: "rest-1",
        existingDate: "2026-07-14T00:00:00Z",
        existingStartTime: "2026-07-14T18:00:00Z",
        existingEndTime: "2026-07-14T20:00:00Z",
        existingPartySize: 4,
      });

      expect(service.checkAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2026-07-14T00:00:00Z",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
        }),
      );
    });

    it("throws when availability check fails", async () => {
      const service = createMockAvailabilityService({
        available: false,
        reason: "party_size_exceeds_maximum",
      });
      const mapper = new AvailabilityMapper();
      const checker = new ReservationAvailabilityChecker(service, mapper);

      await expect(
        checker.checkBeforeUpdate({
          restaurantId: "rest-1",
          date: "2026-07-14",
          startTime: "2026-07-14T18:00:00Z",
          endTime: "2026-07-14T20:00:00Z",
          partySize: 4,
          existingDate: "2026-07-14T00:00:00Z",
          existingStartTime: "2026-07-14T18:00:00Z",
          existingEndTime: "2026-07-14T20:00:00Z",
          existingPartySize: 4,
        }),
      ).rejects.toThrow(ReservationAvailabilityError);
    });
  });
});

describe("ReservationAvailabilityError", () => {
  it("creates error with reason and metadata", () => {
    const error = new ReservationAvailabilityError("restaurant_closed", { dayOfWeek: 3 });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ReservationAvailabilityError");
    expect(error.reason).toBe("restaurant_closed");
    expect(error.metadata).toEqual({ dayOfWeek: 3 });
    expect(error.code).toBe("reservation.availability");
  });

  it("creates error with null reason", () => {
    const error = new ReservationAvailabilityError(null);
    expect(error.reason).toBeNull();
    expect(error.message).toContain("unknown");
  });

  it("includes metadata message in error message", () => {
    const error = new ReservationAvailabilityError(null, {
      message: "Custom availability message",
    });
    expect(error.message).toBe("Custom availability message");
  });
});

describe("TableAvailabilityAdapter (unit)", () => {
  it("passes context correctly from request", async () => {
    const engine = {
      evaluate: vi.fn().mockResolvedValue({ available: true, reason: null }),
    } as any;

    const { TableAvailabilityAdapter } = await import(
      "../infrastructure/adapters/TableAvailabilityAdapter.js"
    );

    const adapter = new TableAvailabilityAdapter(engine);

    const result = await adapter.checkAvailability({
      restaurantId: "rest-1",
      date: "2026-07-14",
      startTime: "2026-07-14T18:00:00Z",
      endTime: "2026-07-14T20:00:00Z",
      partySize: 4,
      tableId: "table-1",
    });

    expect(result.available).toBe(true);
    expect(engine.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: "rest-1",
        date: "2026-07-14",
        time: "18:00",
        partySize: 4,
        duration: 120,
      }),
    );
  });

  it("does not include tableId when not provided", async () => {
    const engine = {
      evaluate: vi.fn().mockResolvedValue({ available: true, reason: null }),
    } as any;

    const { TableAvailabilityAdapter } = await import(
      "../infrastructure/adapters/TableAvailabilityAdapter.js"
    );

    const adapter = new TableAvailabilityAdapter(engine);

    await adapter.checkAvailability({
      restaurantId: "rest-1",
      date: "2026-07-14",
      startTime: "2026-07-14T18:00:00Z",
      endTime: "2026-07-14T20:00:00Z",
      partySize: 4,
    });

    const context = engine.evaluate.mock.calls[0][0];
    expect(context.tableId).toBeUndefined();
  });

  it("includes diningAreaId and tableTypeId when provided", async () => {
    const engine = {
      evaluate: vi.fn().mockResolvedValue({ available: true, reason: null }),
    } as any;

    const { TableAvailabilityAdapter } = await import(
      "../infrastructure/adapters/TableAvailabilityAdapter.js"
    );

    const adapter = new TableAvailabilityAdapter(engine);

    await adapter.checkAvailability({
      restaurantId: "rest-1",
      date: "2026-07-14",
      startTime: "2026-07-14T18:00:00Z",
      endTime: "2026-07-14T20:00:00Z",
      partySize: 4,
      diningAreaId: "area-1",
      tableTypeId: "type-1",
    });

    const context = engine.evaluate.mock.calls[0][0];
    expect(context.diningAreaId).toBe("area-1");
    expect(context.tableTypeId).toBe("type-1");
  });

  it("extracts date and time correctly", async () => {
    const engine = {
      evaluate: vi.fn().mockResolvedValue({ available: true, reason: null }),
    } as any;

    const { TableAvailabilityAdapter } = await import(
      "../infrastructure/adapters/TableAvailabilityAdapter.js"
    );

    const adapter = new TableAvailabilityAdapter(engine);

    await adapter.checkAvailability({
      restaurantId: "rest-1",
      date: "2026-07-14T00:00:00Z",
      startTime: "2026-07-14T19:30:00Z",
      endTime: "2026-07-14T21:00:00Z",
      partySize: 2,
    });

    const context = engine.evaluate.mock.calls[0][0];
    expect(context.date).toBe("2026-07-14");
    expect(context.time).toBe("19:30");
    expect(context.partySize).toBe(2);
    expect(context.duration).toBe(90);
  });
});

describe("Edge Cases", () => {
  it("handles service returning unavailable with metadata", async () => {
    const service = createMockAvailabilityService({
      available: false,
      reason: "party_size_exceeds_maximum",
      metadata: { partySize: 12, maxPartySize: 10 },
    });
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    try {
      await checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 12,
      });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ReservationAvailabilityError);
      expect((error as ReservationAvailabilityError).reason).toBe("party_size_exceeds_maximum");
      expect((error as ReservationAvailabilityError).metadata).toEqual({
        partySize: 12,
        maxPartySize: 10,
      });
    }
  });

  it("handles extremely large party size", async () => {
    const service = createMockAvailabilityService({
      available: false,
      reason: "party_size_exceeds_maximum",
      metadata: { partySize: 50, maxPartySize: 20 },
    });
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    await expect(
      checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 50,
      }),
    ).rejects.toThrow(ReservationAvailabilityError);
  });

  it("handles minimum party size boundary", async () => {
    const service = createMockAvailabilityService({
      available: false,
      reason: "party_size_below_minimum",
      metadata: { partySize: 1, minPartySize: 2 },
    });
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    await expect(
      checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 1,
      }),
    ).rejects.toThrow(ReservationAvailabilityError);
  });

  it("handles advance booking window too soon", async () => {
    const service = createMockAvailabilityService({
      available: false,
      reason: "advance_booking_window",
      metadata: { reason: "too_soon", minimumAdvanceMinutes: 60 },
    });
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    await expect(
      checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
      }),
    ).rejects.toThrow(ReservationAvailabilityError);
  });

  it("handles service throwing unexpected error", async () => {
    const service: AvailabilityService = {
      checkAvailability: vi.fn().mockRejectedValue(new Error("Database connection failed")),
    };
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    await expect(
      checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 4,
      }),
    ).rejects.toThrow("Database connection failed");
  });

  it("handles 0 party size edge case", async () => {
    const service = createMockAvailabilityService({
      available: false,
      reason: "party_size_below_minimum",
      metadata: { partySize: 0, minPartySize: 1 },
    });
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    await expect(
      checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T20:00:00Z",
        partySize: 0,
      }),
    ).rejects.toThrow(ReservationAvailabilityError);
  });

  it("handles same start and end time", async () => {
    const service = createMockAvailabilityService({
      available: false,
      reason: "outside_business_hours",
      metadata: { message: "End time must be after start time" },
    });
    const mapper = new AvailabilityMapper();
    const checker = new ReservationAvailabilityChecker(service, mapper);

    await expect(
      checker.checkBeforeCreate({
        restaurantId: "rest-1",
        date: "2026-07-14",
        startTime: "2026-07-14T18:00:00Z",
        endTime: "2026-07-14T18:00:00Z",
        partySize: 4,
      }),
    ).rejects.toThrow(ReservationAvailabilityError);
  });
});
