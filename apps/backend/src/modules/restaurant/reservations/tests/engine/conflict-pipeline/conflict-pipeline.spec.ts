import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationConflictPipeline } from "../../../engine/conflict-pipeline/ReservationConflictPipeline.js";
import { TableConflictRule } from "../../../engine/conflict-pipeline/rules/TableConflictRule.js";
import { TableGroupConflictRule } from "../../../engine/conflict-pipeline/rules/TableGroupConflictRule.js";
import { RestaurantAvailabilityRule } from "../../../engine/conflict-pipeline/rules/RestaurantAvailabilityRule.js";
import { ReservationTimeConflictRule } from "../../../engine/conflict-pipeline/rules/ReservationTimeConflictRule.js";
import { ReservationPolicyConflictRule } from "../../../engine/conflict-pipeline/rules/ReservationPolicyConflictRule.js";
import { FutureExtensionRule } from "../../../engine/conflict-pipeline/rules/FutureExtensionRule.js";
import { ReservationNumber } from "../../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationSource } from "../../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../../domain/models/ReservationStatus.js";
import type { Reservation } from "../../../domain/models/Reservation.js";

function createReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-1",
    restaurantId: "rest-1",
    reservationNumber: ReservationNumber.create("RES-001"),
    customerId: null,
    tableId: "table-1",
    tableGroupId: null,
    date: ReservationDate.create(new Date("2026-07-14")),
    timeRange: ReservationTimeRange.create(
      new Date("2026-07-14T18:00:00Z"),
      new Date("2026-07-14T20:00:00Z"),
    ),
    partySize: PartySize.create(4),
    status: ReservationStatus.create("confirmed"),
    source: ReservationSource.create("website"),
    notes: null,
    specialRequests: null,
    createdBy: "user-1",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    cancelledAt: null,
    ...overrides,
  };
}

const defaultContext = {
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
};

describe("ReservationConflictPipeline", () => {
  let mockRepository: any;
  let mockAvailabilityService: any;

  beforeEach(() => {
    mockRepository = {
      findByFilters: vi.fn().mockResolvedValue([]),
    };

    mockAvailabilityService = {
      checkAvailability: vi.fn().mockResolvedValue({ available: true, reason: null }),
    };
  });

  describe("Pipeline orchestrator", () => {
    it("returns no conflict when all rules pass", async () => {
      const pipeline = new ReservationConflictPipeline([
        new TableConflictRule(mockRepository),
        new TableGroupConflictRule(mockRepository),
        new RestaurantAvailabilityRule(mockAvailabilityService),
        new ReservationTimeConflictRule(mockRepository),
        new ReservationPolicyConflictRule(),
        new FutureExtensionRule(),
      ]);

      const result = await pipeline.evaluate(defaultContext);

      expect(result.hasConflict).toBe(false);
      expect(result.severity).toBe("info");
      expect(result.results).toHaveLength(6);
      expect(result.primaryReason).toBeNull();
    });

    it("stops execution on blocking conflict", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "existing-1",
          tableId: "table-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const tableRule = new TableConflictRule(mockRepository);
      const passedRule = new (class implements import("../../../engine/conflict-pipeline/ConflictRule.js").ConflictRule {
        readonly name = "should_not_run";
        async evaluate() {
          throw new Error("This rule should not have been called");
        }
      })();

      const pipeline = new ReservationConflictPipeline([tableRule, passedRule]);

      const result = await pipeline.evaluate({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.hasConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.primaryCode).toBe("TABLE_CONFLICT");
    });

    it("evaluateAll runs all rules regardless of blocking", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "existing-1",
          tableId: "table-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const pipeline = new ReservationConflictPipeline([
        new TableConflictRule(mockRepository),
        new FutureExtensionRule(),
      ]);

      const result = await pipeline.evaluateAll({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.hasConflict).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it("collects conflicting reservation IDs", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "conflict-1",
          tableId: "table-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const pipeline = new ReservationConflictPipeline([
        new TableConflictRule(mockRepository),
      ]);

      const result = await pipeline.evaluate({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.conflictingReservationIds).toContain("conflict-1");
    });

    it("deduplicates conflicting reservation IDs", async () => {
      mockRepository.findByFilters
        .mockResolvedValueOnce([
          createReservation({
            id: "overlap-1",
            tableId: "table-1",
            timeRange: ReservationTimeRange.create(
              new Date("2026-07-14T18:30:00Z"),
              new Date("2026-07-14T20:30:00Z"),
            ),
          }),
        ])
        .mockResolvedValueOnce([
          createReservation({
            id: "overlap-1",
            tableId: null,
            timeRange: ReservationTimeRange.create(
              new Date("2026-07-14T18:30:00Z"),
              new Date("2026-07-14T20:30:00Z"),
            ),
          }),
        ]);

      const pipeline = new ReservationConflictPipeline([
        new TableConflictRule(mockRepository),
        new ReservationTimeConflictRule(mockRepository),
      ]);

      const result = await pipeline.evaluateAll({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.conflictingReservationIds).toHaveLength(1);
    });
  });

  describe("TableConflictRule", () => {
    it("returns no conflict when tableId is not provided", async () => {
      const rule = new TableConflictRule(mockRepository);
      const result = await rule.evaluate(defaultContext);
      expect(result.isConflict).toBe(false);
    });

    it("returns blocking conflict when table has overlapping reservation", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "other-res",
          tableId: "table-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T19:00:00Z"),
            new Date("2026-07-14T21:00:00Z"),
          ),
        }),
      ]);

      const rule = new TableConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.code).toBe("TABLE_CONFLICT");
    });

    it("returns no conflict for non-overlapping times on same table", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "other-res",
          tableId: "table-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T12:00:00Z"),
            new Date("2026-07-14T14:00:00Z"),
          ),
        }),
      ]);

      const rule = new TableConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.isConflict).toBe(false);
    });

    it("ignores cancelled reservations", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "cancelled-res",
          tableId: "table-1",
          status: ReservationStatus.create("cancelled"),
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const rule = new TableConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.isConflict).toBe(false);
    });

    it("excludes own reservation when checking for updates", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "res-1",
          tableId: "table-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:00:00Z"),
            new Date("2026-07-14T20:00:00Z"),
          ),
        }),
      ]);

      const rule = new TableConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        tableId: "table-1",
        excludeReservationId: "res-1",
      });

      expect(result.isConflict).toBe(false);
    });

    it("detects conflict for different table", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "other-res",
          tableId: "table-2",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const rule = new TableConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        tableId: "table-1",
      });

      expect(result.isConflict).toBe(false);
    });
  });

  describe("TableGroupConflictRule", () => {
    it("returns no conflict when tableGroupId is not provided", async () => {
      const rule = new TableGroupConflictRule(mockRepository);
      const result = await rule.evaluate(defaultContext);
      expect(result.isConflict).toBe(false);
    });

    it("returns blocking conflict when table group has overlapping reservation", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "group-res",
          tableId: null,
          tableGroupId: "group-1",
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const rule = new TableGroupConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        tableGroupId: "group-1",
      });

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.code).toBe("TABLE_GROUP_CONFLICT");
    });
  });

  describe("RestaurantAvailabilityRule", () => {
    it("returns no conflict when availability passes", async () => {
      const rule = new RestaurantAvailabilityRule(mockAvailabilityService);
      const result = await rule.evaluate(defaultContext);
      expect(result.isConflict).toBe(false);
    });

    it("returns blocking conflict when availability fails", async () => {
      mockAvailabilityService.checkAvailability.mockResolvedValue({
        available: false,
        reason: "restaurant_closed",
        metadata: { message: "Restaurant is closed on this date" },
      });

      const rule = new RestaurantAvailabilityRule(mockAvailabilityService);
      const result = await rule.evaluate(defaultContext);

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.code).toBe("RESTAURANT_AVAILABILITY");
    });

    it("passes context parameters to availability service", async () => {
      const rule = new RestaurantAvailabilityRule(mockAvailabilityService);
      await rule.evaluate({
        ...defaultContext,
        tableId: "table-1",
        diningAreaId: "area-1",
        tableTypeId: "type-1",
      });

      expect(mockAvailabilityService.checkAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: "rest-1",
          tableId: "table-1",
          diningAreaId: "area-1",
          tableTypeId: "type-1",
          partySize: 4,
        }),
      );
    });
  });

  describe("ReservationTimeConflictRule", () => {
    it("returns no conflict when no overlapping reservations exist", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "non-overlap",
          tableId: null,
          tableGroupId: null,
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T12:00:00Z"),
            new Date("2026-07-14T14:00:00Z"),
          ),
        }),
      ]);

      const rule = new ReservationTimeConflictRule(mockRepository);
      const result = await rule.evaluate(defaultContext);

      expect(result.isConflict).toBe(false);
    });

    it("returns warning for overlapping reservations without table", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "overlap-no-table",
          tableId: null,
          tableGroupId: null,
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:30:00Z"),
            new Date("2026-07-14T20:30:00Z"),
          ),
        }),
      ]);

      const rule = new ReservationTimeConflictRule(mockRepository);
      const result = await rule.evaluate(defaultContext);

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("warning");
      expect(result.code).toBe("TIME_WARNING");
    });

    it("excludes own reservation ID", async () => {
      mockRepository.findByFilters.mockResolvedValue([
        createReservation({
          id: "res-1",
          tableId: null,
          tableGroupId: null,
          timeRange: ReservationTimeRange.create(
            new Date("2026-07-14T18:00:00Z"),
            new Date("2026-07-14T20:00:00Z"),
          ),
        }),
      ]);

      const rule = new ReservationTimeConflictRule(mockRepository);
      const result = await rule.evaluate({
        ...defaultContext,
        excludeReservationId: "res-1",
      });

      expect(result.isConflict).toBe(false);
    });

    it("handles empty repository result gracefully", async () => {
      mockRepository.findByFilters.mockResolvedValue([]);

      const rule = new ReservationTimeConflictRule(mockRepository);
      const result = await rule.evaluate(defaultContext);

      expect(result.isConflict).toBe(false);
    });
  });

  describe("ReservationPolicyConflictRule", () => {
    it("returns no conflict for valid party size and time range", async () => {
      const rule = new ReservationPolicyConflictRule();
      const result = await rule.evaluate(defaultContext);

      expect(result.isConflict).toBe(false);
    });

    it("returns blocking conflict for party size exceeding maximum", async () => {
      const rule = new ReservationPolicyConflictRule();
      const result = await rule.evaluate({
        ...defaultContext,
        partySize: 101,
      });

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.code).toBe("PARTY_SIZE_POLICY");
    });

    it("returns warning for large party", async () => {
      const rule = new ReservationPolicyConflictRule();
      const result = await rule.evaluate({
        ...defaultContext,
        partySize: 10,
      });

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("warning");
      expect(result.code).toBe("LARGE_PARTY_WARNING");
    });

    it("returns blocking conflict for invalid time range", async () => {
      const rule = new ReservationPolicyConflictRule();
      const result = await rule.evaluate({
        ...defaultContext,
        startTime: new Date("2026-07-14T20:00:00Z"),
        endTime: new Date("2026-07-14T18:00:00Z"),
      });

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.code).toBe("TIME_RANGE_POLICY");
    });
  });

  describe("FutureExtensionRule", () => {
    it("always returns no conflict (placeholder)", async () => {
      const rule = new FutureExtensionRule();
      const result = await rule.evaluate(defaultContext);

      expect(result.isConflict).toBe(false);
      expect(result.severity).toBe("info");
    });
  });

  describe("ConflictResult helpers", () => {
    it("noConflict returns correct shape", async () => {
      const { noConflict } = await import("../../../engine/conflict-pipeline/ConflictResult.js");
      const result = noConflict();

      expect(result.isConflict).toBe(false);
      expect(result.severity).toBe("info");
      expect(result.reason).toBeNull();
      expect(result.code).toBeNull();
    });

    it("blockingConflict returns correct shape", async () => {
      const { blockingConflict } = await import("../../../engine/conflict-pipeline/ConflictResult.js");
      const result = blockingConflict("TEST_CODE", "Test reason", { key: "value" });

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("blocking");
      expect(result.reason).toBe("Test reason");
      expect(result.code).toBe("TEST_CODE");
      expect(result.metadata).toEqual({ key: "value" });
    });

    it("warningConflict returns correct shape", async () => {
      const { warningConflict } = await import("../../../engine/conflict-pipeline/ConflictResult.js");
      const result = warningConflict("WARN", "Warning");

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("warning");
      expect(result.reason).toBe("Warning");
      expect(result.code).toBe("WARN");
    });

    it("infoConflict returns correct shape", async () => {
      const { infoConflict } = await import("../../../engine/conflict-pipeline/ConflictResult.js");
      const result = infoConflict("INFO", "Information");

      expect(result.isConflict).toBe(true);
      expect(result.severity).toBe("info");
      expect(result.reason).toBe("Information");
      expect(result.code).toBe("INFO");
    });
  });

  describe("Pipeline with custom rule ordering", () => {
    it("processes rules in provided order", async () => {
      const callOrder: string[] = [];

      const rule1 = new (class implements import("../../../engine/conflict-pipeline/ConflictRule.js").ConflictRule {
        readonly name = "rule1";
        async evaluate() {
          callOrder.push("rule1");
          const { noConflict } = await import("../../../engine/conflict-pipeline/ConflictResult.js");
          return noConflict();
        }
      })();

      const rule2 = new (class implements import("../../../engine/conflict-pipeline/ConflictRule.js").ConflictRule {
        readonly name = "rule2";
        async evaluate() {
          callOrder.push("rule2");
          const { noConflict } = await import("../../../engine/conflict-pipeline/ConflictResult.js");
          return noConflict();
        }
      })();

      const pipeline = new ReservationConflictPipeline([rule1, rule2]);
      await pipeline.evaluate(defaultContext);

      expect(callOrder).toEqual(["rule1", "rule2"]);
    });
  });
});
