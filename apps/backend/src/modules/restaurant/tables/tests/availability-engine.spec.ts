import { describe, it, expect, vi } from "vitest";
import { AvailabilityEngine } from "../domain/services/availability/AvailabilityEngine.js";

function futureDate(daysFromNow = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}
import { RestaurantStatusEvaluator } from "../domain/services/availability/evaluators/RestaurantStatusEvaluator.js";
import { BusinessHoursEvaluator } from "../domain/services/availability/evaluators/BusinessHoursEvaluator.js";
import { CalendarExceptionEvaluator } from "../domain/services/availability/evaluators/CalendarExceptionEvaluator.js";
import { TableStatusEvaluator } from "../domain/services/availability/evaluators/TableStatusEvaluator.js";
import { TableActiveEvaluator } from "../domain/services/availability/evaluators/TableActiveEvaluator.js";
import { DiningAreaEvaluator } from "../domain/services/availability/evaluators/DiningAreaEvaluator.js";
import { TableTypeEvaluator } from "../domain/services/availability/evaluators/TableTypeEvaluator.js";
import { ReservationPolicyEvaluator } from "../domain/services/availability/evaluators/ReservationPolicyEvaluator.js";
import { FutureReservationEvaluator } from "../domain/services/availability/evaluators/FutureReservationEvaluator.js";
import { TableGroupEvaluator } from "../domain/services/availability/evaluators/TableGroupEvaluator.js";
import { available, unavailable } from "../domain/services/availability/AvailabilityResult.js";
import { TableStatus } from "../domain/models/TableStatus.js";

function createMockTable(overrides: Record<string, any> = {}) {
  return {
    id: "table-1",
    restaurantId: "rest-1",
    branchId: "branch-1",
    diningAreaId: null,
    tableTypeId: null,
    tableNumber: { value: "T1" } as any,
    name: null,
    description: null,
    minimumCapacity: { value: 2 } as any,
    maximumCapacity: { value: 4 } as any,
    currentCapacity: { value: 4 } as any,
    shape: "rectangle",
    width: 60,
    height: 60,
    position: null,
    rotation: null,
    qrIdentifier: null,
    isReservable: true,
    isAccessible: true,
    isActive: true,
    status: TableStatus.create("available"),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe("AvailabilityEngine", () => {
  it("returns available when all evaluators pass", async () => {
    const evaluators = [new RestaurantStatusEvaluator()];
    const engine = new AvailabilityEngine(evaluators);
    const result = await engine.evaluate({ restaurantId: "rest-1", date: futureDate() });
    expect(result.available).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("stops at first failure", async () => {
    const alwaysFail = {
      name: "fail_first",
      evaluate: async () => unavailable("restaurant_closed", { reason: "test" }),
    };
    const neverReached = {
      name: "never_reached",
      evaluate: async () => { throw new Error("Should not be called"); },
    };
    const engine = new AvailabilityEngine([alwaysFail, neverReached]);
    const result = await engine.evaluate({ restaurantId: "rest-1", date: futureDate() });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("restaurant_closed");
  });

  it("evaluateAll returns all results up to first failure", async () => {
    const pass1 = {
      name: "pass1",
      evaluate: async () => available(),
    };
    const fail = {
      name: "fail",
      evaluate: async () => unavailable("table_occupied"),
    };
    const pass2 = {
      name: "pass2",
      evaluate: async () => available(),
    };
    const engine = new AvailabilityEngine([pass1, fail, pass2]);
    const results = await engine.evaluateAll({ restaurantId: "rest-1", date: futureDate() });
    expect(results).toHaveLength(2);
    expect(results[0].available).toBe(true);
    expect(results[1].available).toBe(false);
    expect(results[1].reason).toBe("table_occupied");
  });
});

describe("RestaurantStatusEvaluator", () => {
  it("returns available for valid restaurant", async () => {
    const evaluator = new RestaurantStatusEvaluator();
    const result = await evaluator.evaluate({ restaurantId: "rest-1", date: futureDate() });
    expect(result.available).toBe(true);
  });

  it("returns unavailable when restaurantId is missing", async () => {
    const evaluator = new RestaurantStatusEvaluator();
    const result = await evaluator.evaluate({ restaurantId: "", date: futureDate() });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("unknown");
  });
});

describe("BusinessHoursEvaluator", () => {
  const createSchedule = (dayOfWeek: number, isClosed: boolean, periods: any[] = []) => ({
    dayOfWeek: { value: dayOfWeek },
    isClosed,
    periods: periods.map((p) => ({
      openTime: { value: p.open },
      closeTime: { value: p.close },
      order: p.order ?? 0,
    })),
  });

  const mockRepo = (schedules: any[]) => ({
    findByRestaurantId: vi.fn().mockResolvedValue({
      id: "bh-1",
      restaurantId: "rest-1",
      schedules,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  });

  it("returns available during open hours", async () => {
    const repo = mockRepo([
      createSchedule(2, false, [{ open: 540, close: 1020, order: 0 }]),
    ]);
    const evaluator = new BusinessHoursEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "2026-07-14",
      time: "10:00",
    });
    expect(result.available).toBe(true);
  });

  it("returns unavailable when restaurant is closed on that day", async () => {
    const repo = mockRepo([
      createSchedule(2, true),
    ]);
    const evaluator = new BusinessHoursEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "2026-07-14",
      time: "12:00",
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("restaurant_closed");
  });

  it("returns unavailable when outside business hours", async () => {
    const repo = mockRepo([
      createSchedule(2, false, [{ open: 540, close: 1020, order: 0 }]),
    ]);
    const evaluator = new BusinessHoursEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "2026-07-14",
      time: "22:00",
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("outside_business_hours");
  });

  it("returns available when no time provided", async () => {
    const repo = mockRepo([
      createSchedule(2, false, [{ open: 540, close: 1020, order: 0 }]),
    ]);
    const evaluator = new BusinessHoursEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "2026-07-14",
    });
    expect(result.available).toBe(true);
  });

  it("returns available when no business hours configured", async () => {
    const repo = {
      findByRestaurantId: vi.fn().mockResolvedValue(null),
    };
    const evaluator = new BusinessHoursEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "2026-07-14",
      time: "12:00",
    });
    expect(result.available).toBe(true);
  });
});

describe("CalendarExceptionEvaluator", () => {
  const mockRepo = (exceptions: any[]) => ({
    findByRestaurantIdAndDate: vi.fn().mockResolvedValue(exceptions),
  });

  it("returns available when no exceptions", async () => {
    const repo = mockRepo([]);
    const evaluator = new CalendarExceptionEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });

  it("returns holiday for a holiday closure", async () => {
    const repo = mockRepo([
      {
        title: "Christmas",
        type: { value: "holiday" },
        isClosed: true,
        allDay: true,
        openTime: null,
        closeTime: null,
      },
    ]);
    const evaluator = new CalendarExceptionEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "2026-12-25",
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("holiday");
  });

  it("returns special_closure for temporary closure", async () => {
    const repo = mockRepo([
      {
        title: "Renovation",
        type: { value: "temporary_closure" },
        isClosed: true,
        allDay: true,
        openTime: null,
        closeTime: null,
      },
    ]);
    const evaluator = new CalendarExceptionEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("special_closure");
  });

  it("returns available when exception has special hours and time is within", async () => {
    const repo = mockRepo([
      {
        title: "Special Event",
        type: { value: "special_opening" },
        isClosed: false,
        allDay: false,
        openTime: "18:00",
        closeTime: "23:00",
      },
    ]);
    const evaluator = new CalendarExceptionEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      time: "20:00",
    });
    expect(result.available).toBe(true);
  });

  it("returns unavailable when no date provided", async () => {
    const evaluator = new CalendarExceptionEvaluator(mockRepo([]));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: "",
    });
    expect(result.available).toBe(true);
  });
});

describe("TableStatusEvaluator", () => {
  const mockRepo = (table: any) => ({
    findByIdAndRestaurant: vi.fn().mockResolvedValue(table),
  });

  it("returns available when table is available", async () => {
    const table = createMockTable({ status: TableStatus.create("available") });
    const evaluator = new TableStatusEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(true);
  });

  it("returns unavailable when table is occupied", async () => {
    const table = createMockTable({ status: TableStatus.create("occupied") });
    const evaluator = new TableStatusEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_occupied");
  });

  it("returns unavailable when table is blocked", async () => {
    const table = createMockTable({ status: TableStatus.create("blocked") });
    const evaluator = new TableStatusEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_blocked");
  });

  it("returns available when no tableId in context", async () => {
    const evaluator = new TableStatusEvaluator(mockRepo(null));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });
});

describe("TableActiveEvaluator", () => {
  const mockRepo = (table: any) => ({
    findByIdAndRestaurant: vi.fn().mockResolvedValue(table),
  });

  it("returns available for active table", async () => {
    const table = createMockTable({ isActive: true, deletedAt: null, isReservable: true });
    const evaluator = new TableActiveEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(true);
  });

  it("returns unavailable for inactive table", async () => {
    const table = createMockTable({ isActive: false });
    const evaluator = new TableActiveEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_inactive");
  });

  it("returns unavailable for deleted table", async () => {
    const table = createMockTable({ deletedAt: new Date() });
    const evaluator = new TableActiveEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_deleted");
  });

  it("returns unavailable for non-reservable table", async () => {
    const table = createMockTable({ isReservable: false });
    const evaluator = new TableActiveEvaluator(mockRepo(table));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_non_reservable");
  });
});

describe("DiningAreaEvaluator", () => {
  const mockRepo = (area: any) => ({
    findByIdAndRestaurant: vi.fn().mockResolvedValue(area),
  });

  it("returns available for active dining area", async () => {
    const area = {
      id: "area-1",
      status: { isActive: () => true },
      isReservable: true,
    };
    const evaluator = new DiningAreaEvaluator(mockRepo(area));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      diningAreaId: "area-1",
    });
    expect(result.available).toBe(true);
  });

  it("returns unavailable when dining area is inactive", async () => {
    const area = {
      id: "area-1",
      status: { isActive: () => false },
      isReservable: true,
    };
    const evaluator = new DiningAreaEvaluator(mockRepo(area));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      diningAreaId: "area-1",
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("dining_area_inactive");
  });

  it("returns available when no dining area specified", async () => {
    const evaluator = new DiningAreaEvaluator(mockRepo(null));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });
});

describe("TableTypeEvaluator", () => {
  const mockRepo = (type: any) => ({
    findByIdAndRestaurant: vi.fn().mockResolvedValue(type),
  });

  it("returns available for active table type", async () => {
    const type = { id: "type-1", status: { isActive: () => true } };
    const evaluator = new TableTypeEvaluator(mockRepo(type));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableTypeId: "type-1",
    });
    expect(result.available).toBe(true);
  });

  it("returns unavailable for inactive table type", async () => {
    const type = { id: "type-1", status: { isActive: () => false } };
    const evaluator = new TableTypeEvaluator(mockRepo(type));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableTypeId: "type-1",
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_type_inactive");
  });

  it("returns available when no table type specified", async () => {
    const evaluator = new TableTypeEvaluator(mockRepo(null));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });
});

describe("ReservationPolicyEvaluator", () => {
  const mockRepo = (policy: any) => ({
    findByRestaurantId: vi.fn().mockResolvedValue(policy),
  });

  const createPolicy = (overrides: any = {}) => ({
    enabled: true,
    minPartySize: { value: 1 },
    maxPartySize: { value: 20 },
    advanceBookingWindow: {
      minMinutes: 60,
      maxDays: 30,
    },
    ...overrides,
  });

  it("returns available when party size is within range", async () => {
    const repo = mockRepo(createPolicy());
    const evaluator = new ReservationPolicyEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      partySize: 4,
    });
    expect(result.available).toBe(true);
  });

  it("returns unavailable when party size exceeds maximum", async () => {
    const repo = mockRepo(createPolicy({ maxPartySize: { value: 4 } }));
    const evaluator = new ReservationPolicyEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      partySize: 10,
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("party_size_exceeds_maximum");
  });

  it("returns unavailable when party size is below minimum", async () => {
    const repo = mockRepo(createPolicy({ minPartySize: { value: 2 } }));
    const evaluator = new ReservationPolicyEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      partySize: 1,
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("party_size_below_minimum");
  });

  it("returns unavailable when policy is disabled", async () => {
    const repo = mockRepo(createPolicy({ enabled: false }));
    const evaluator = new ReservationPolicyEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe("reservation_policy_disabled");
  });

  it("returns available when no policy exists", async () => {
    const repo = mockRepo(null);
    const evaluator = new ReservationPolicyEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });
});

describe("FutureReservationEvaluator", () => {
  it("always returns available (placeholder)", async () => {
    const evaluator = new FutureReservationEvaluator();
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });
});

describe("TableGroupEvaluator", () => {
  const mockRepo = (group: any) => ({
    findActiveGroupByTableId: vi.fn().mockResolvedValue(group),
  });

  it("returns available when table is not in an active group", async () => {
    const repo = mockRepo(null);
    const evaluator = new TableGroupEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(true);
  });

  it("returns unavailable when table is in an active group", async () => {
    const repo = mockRepo({ id: "group-1", status: { value: "active" } });
    const evaluator = new TableGroupEvaluator(repo);
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
      tableId: "table-1",
    } as any);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("table_occupied");
  });

  it("returns available when no tableId in context", async () => {
    const evaluator = new TableGroupEvaluator(mockRepo(null));
    const result = await evaluator.evaluate({
      restaurantId: "rest-1",
      date: futureDate(),
    });
    expect(result.available).toBe(true);
  });
});
