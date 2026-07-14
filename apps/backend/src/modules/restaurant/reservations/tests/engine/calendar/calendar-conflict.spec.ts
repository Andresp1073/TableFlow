import { describe, it, expect, vi, beforeEach } from "vitest";
import { CalendarConflictAggregator } from "../../../engine/calendar/CalendarConflictAggregator.js";
import { ReservationConflictPipeline } from "../../../engine/conflict-pipeline/ReservationConflictPipeline.js";
import { noConflict, blockingConflict, warningConflict } from "../../../engine/conflict-pipeline/ConflictResult.js";
import { ReservationDate } from "../../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../../domain/models/PartySize.js";
import { ReservationStatus } from "../../../domain/models/ReservationStatus.js";

function createActiveReservation(id: string, tableId: string | null = "table-1") {
  const date = new Date("2026-07-14");
  return {
    id,
    restaurantId: "rest-1",
    reservationNumber: { value: `RES-${id}` },
    customerId: "cust-1",
    tableId,
    tableGroupId: null,
    date: ReservationDate.create(date),
    timeRange: ReservationTimeRange.create(
      new Date("2026-07-14T18:00:00Z"),
      new Date("2026-07-14T20:00:00Z"),
    ),
    partySize: PartySize.create(4),
    status: ReservationStatus.create("confirmed"),
    source: { value: "website" },
    notes: null,
    specialRequests: null,
    createdBy: "user-1",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    cancelledAt: null,
  };
}

const date = new Date("2026-07-14");

describe("CalendarConflictAggregator", () => {
  let pipeline: ReservationConflictPipeline;

  beforeEach(() => {
    pipeline = new ReservationConflictPipeline([]);
  });

  it("returns empty conflicts when no reservations have conflicts", async () => {
    pipeline = new ReservationConflictPipeline([
      { name: "pass", evaluate: async () => noConflict() },
      { name: "pass2", evaluate: async () => noConflict() },
    ]);

    const aggregator = new CalendarConflictAggregator(pipeline);
    const result = await aggregator.aggregate(
      date,
      "rest-1",
      [createActiveReservation("r1")],
    );

    expect(result.totalConflicts).toBe(0);
    expect(result.blockingConflicts).toBe(0);
    expect(result.warningConflicts).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it("aggregates blocking conflicts", async () => {
    pipeline = new ReservationConflictPipeline([
      {
        name: "table_conflict",
        evaluate: async () => blockingConflict("TABLE_CONFLICT", "Table already reserved", {
          rule: "table_conflict",
          conflictingIds: ["r2"],
        }),
      },
    ]);

    const aggregator = new CalendarConflictAggregator(pipeline);
    const result = await aggregator.aggregate(
      date,
      "rest-1",
      [createActiveReservation("r1"), createActiveReservation("r2")],
    );

    expect(result.totalConflicts).toBe(2);
    expect(result.blockingConflicts).toBe(2);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.code).toBe("TABLE_CONFLICT");
    expect(result.conflicts[0]?.count).toBe(2);
  });

  it("aggregates multiple conflict types", async () => {
    pipeline = new ReservationConflictPipeline([
      {
        name: "table_conflict",
        evaluate: async () => blockingConflict("TABLE_CONFLICT", "Table already reserved", {
          rule: "table_conflict",
        }),
      },
      {
        name: "policy_conflict",
        evaluate: async () => warningConflict("POLICY_CONFLICT", "Policy violation", {
          rule: "policy_conflict",
        }),
      },
    ]);

    const aggregator = new CalendarConflictAggregator(pipeline);
    const result = await aggregator.aggregate(
      date,
      "rest-1",
      [createActiveReservation("r1")],
    );

    expect(result.totalConflicts).toBe(2);
    expect(result.blockingConflicts).toBe(1);
    expect(result.warningConflicts).toBe(1);
    expect(result.conflicts).toHaveLength(2);
  });

  it("counts separate conflict rules independently", async () => {
    pipeline = new ReservationConflictPipeline([
      {
        name: "rule_a",
        evaluate: async () => blockingConflict("RULE_A", "Conflict A", { rule: "rule_a" }),
      },
      {
        name: "rule_b",
        evaluate: async () => blockingConflict("RULE_B", "Conflict B", { rule: "rule_b" }),
      },
    ]);

    const aggregator = new CalendarConflictAggregator(pipeline);
    const result = await aggregator.aggregate(
      date,
      "rest-1",
      [createActiveReservation("r1"), createActiveReservation("r2")],
    );

    expect(result.conflicts).toHaveLength(2);
    expect(result.conflicts.find((c) => c.code === "RULE_A")?.count).toBe(2);
    expect(result.conflicts.find((c) => c.code === "RULE_B")?.count).toBe(2);
  });

  it("returns empty for no active reservations", async () => {
    pipeline = new ReservationConflictPipeline([
      { name: "rule", evaluate: async () => blockingConflict("X", "X", { rule: "x" }) },
    ]);

    const aggregator = new CalendarConflictAggregator(pipeline);
    const result = await aggregator.aggregate(date, "rest-1", []);

    expect(result.totalConflicts).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });
});
