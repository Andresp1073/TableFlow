import { describe, it, expect, vi } from "vitest";
import { DefaultAssignmentStrategy, BestFitAssignmentStrategy } from "../../../engine/assignment/AssignmentStrategy.js";
import { AssignmentScoringEngine } from "../../../engine/assignment/AssignmentScoringEngine.js";

function createCandidate(overrides: Record<string, unknown> = {}) {
  return {
    tableId: overrides.tableId ?? "table-1",
    partySize: 4,
    isTableGroup: overrides.isTableGroup === undefined ? false : (overrides.isTableGroup as boolean),
    tableGroupId: overrides.tableGroupId === undefined ? null : (overrides.tableGroupId as string | null),
    diningAreaId: "area-1",
    tableTypeId: "type-1",
    minimumCapacity: overrides.minimumCapacity === undefined ? 2 : (overrides.minimumCapacity as number),
    maximumCapacity: overrides.maximumCapacity === undefined ? 4 : (overrides.maximumCapacity as number),
    isAccessible: false,
    isAvailable: overrides.isAvailable === undefined ? true : (overrides.isAvailable as boolean),
    availabilityReason: null,
  };
}

const defaultContext = {
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
};

describe("DefaultAssignmentStrategy", () => {
  it("selects the candidate with highest score", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new DefaultAssignmentStrategy(scoringEngine);

    const candidates = [
      createCandidate({ tableId: "table-1", minimumCapacity: 2, maximumCapacity: 4 }),
      createCandidate({ tableId: "table-2", minimumCapacity: 2, maximumCapacity: 6 }),
    ];

    const result = strategy.select(candidates, defaultContext);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBe("table-1");
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns not_assigned when candidates are empty", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new DefaultAssignmentStrategy(scoringEngine);

    const result = strategy.select([], defaultContext);

    expect(result.status).toBe("not_assigned");
    expect(result.reason).toBe("No available candidates found");
  });

  it("returns not_assigned when all scores are zero", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new DefaultAssignmentStrategy(scoringEngine);

    const candidates = [
      createCandidate({
        minimumCapacity: 6,
        maximumCapacity: 0,
        isAvailable: false,
        diningAreaId: "area-1",
      }),
    ];

    const result = strategy.select(candidates, { ...defaultContext, partySize: 1, preferredDiningAreaId: "area-2" });

    expect(result.status).toBe("not_assigned");
    expect(result.reason).toBe("No suitable candidate found");
  });

  it("includes strategy metadata in result", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new DefaultAssignmentStrategy(scoringEngine);

    const candidates = [createCandidate()];

    const result = strategy.select(candidates, defaultContext);

    expect(result.metadata?.strategy).toBe("default");
    expect(result.metadata?.candidatesEvaluated).toBe(1);
  });

  it("returns assignedGroup for table group candidates", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new DefaultAssignmentStrategy(scoringEngine);

    const candidates = [
      createCandidate({
        tableId: "table-1",
        isTableGroup: true,
        tableGroupId: "group-1",
        minimumCapacity: 4,
        maximumCapacity: 8,
      }),
    ];

    const result = strategy.select(candidates, defaultContext);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBeNull();
    expect(result.tableGroupId).toBe("group-1");
  });
});

describe("BestFitAssignmentStrategy", () => {
  it("selects candidate with least wasted capacity", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new BestFitAssignmentStrategy(scoringEngine);

    const candidates = [
      createCandidate({ tableId: "table-1", maximumCapacity: 8, isAvailable: true }),
      createCandidate({ tableId: "table-2", maximumCapacity: 4, isAvailable: true }),
      createCandidate({ tableId: "table-3", maximumCapacity: 6, isAvailable: true }),
    ];

    const result = strategy.select(candidates, defaultContext);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBe("table-2");
  });

  it("returns not_assigned when no available candidates", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new BestFitAssignmentStrategy(scoringEngine);

    const candidates = [
      createCandidate({ tableId: "table-1", isAvailable: false }),
    ];

    const result = strategy.select(candidates, defaultContext);

    expect(result.status).toBe("not_assigned");
    expect(result.reason).toBe("No available tables found for the requested time");
  });

  it("returns not_assigned when candidates are empty", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new BestFitAssignmentStrategy(scoringEngine);

    const result = strategy.select([], defaultContext);

    expect(result.status).toBe("not_assigned");
  });

  it("includes strategy metadata", () => {
    const scoringEngine = new AssignmentScoringEngine();
    const strategy = new BestFitAssignmentStrategy(scoringEngine);

    const candidates = [createCandidate({ tableId: "table-1" })];

    const result = strategy.select(candidates, defaultContext);

    expect(result.metadata?.strategy).toBe("best_fit");
    expect(result.metadata?.candidatesEvaluated).toBe(1);
  });
});
