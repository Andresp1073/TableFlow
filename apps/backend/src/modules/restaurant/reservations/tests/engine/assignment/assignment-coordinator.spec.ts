import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssignmentCoordinator } from "../../../engine/assignment/AssignmentCoordinator.js";
import { AssignmentCandidateGenerator } from "../../../engine/assignment/AssignmentCandidateGenerator.js";
import { AssignmentScoringEngine } from "../../../engine/assignment/AssignmentScoringEngine.js";
import { DefaultAssignmentStrategy } from "../../../engine/assignment/AssignmentStrategy.js";
import { notAssigned, assigned } from "../../../engine/assignment/AssignmentResult.js";
import type { AssignmentStrategy } from "../../../engine/assignment/AssignmentStrategy.js";
import type { AssignmentCandidate } from "../../../engine/assignment/types.js";

const defaultContext = {
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
};

describe("AssignmentCoordinator", () => {
  let mockCandidateGenerator: any;
  let scoringEngine: AssignmentScoringEngine;
  let defaultStrategy: DefaultAssignmentStrategy;
  let coordinator: AssignmentCoordinator;

  beforeEach(() => {
    mockCandidateGenerator = {
      generate: vi.fn(),
    };

    scoringEngine = new AssignmentScoringEngine();
    defaultStrategy = new DefaultAssignmentStrategy(scoringEngine);
    coordinator = new AssignmentCoordinator(
      mockCandidateGenerator,
      defaultStrategy,
    );
  });

  it("assigns the best candidate", async () => {
    const candidates = [
      {
        tableId: "table-1",
        partySize: 4,
        isTableGroup: false,
        tableGroupId: null,
        diningAreaId: "area-1",
        tableTypeId: "type-1",
        minimumCapacity: 2,
        maximumCapacity: 4,
        isAccessible: false,
        isAvailable: true,
        availabilityReason: null,
      },
    ];

    mockCandidateGenerator.generate.mockResolvedValue(candidates);

    const result = await coordinator.assign(defaultContext);

    expect(result.status).toBe("assigned");
    expect(result.tableId).toBe("table-1");
  });

  it("assigns with a custom strategy", async () => {
    const candidates = [
      {
        tableId: "table-1",
        partySize: 4,
        isTableGroup: false,
        tableGroupId: null,
        diningAreaId: "area-1",
        tableTypeId: "type-1",
        minimumCapacity: 2,
        maximumCapacity: 4,
        isAccessible: false,
        isAvailable: true,
        availabilityReason: null,
      },
    ];

    mockCandidateGenerator.generate.mockResolvedValue(candidates);

    const customStrategy: AssignmentStrategy = {
      name: "custom",
      select: vi.fn().mockReturnValue(assigned("table-custom", 0.95)),
    };

    const result = await coordinator.assignWithStrategy(defaultContext, customStrategy);

    expect(result.tableId).toBe("table-custom");
    expect(customStrategy.select).toHaveBeenCalledWith(candidates, defaultContext);
  });

  it("returns candidates via getCandidates", async () => {
    const candidates = [
      {
        tableId: "table-1",
        partySize: 4,
        isTableGroup: false,
        tableGroupId: null,
        diningAreaId: "area-1",
        tableTypeId: "type-1",
        minimumCapacity: 2,
        maximumCapacity: 4,
        isAccessible: false,
        isAvailable: true,
        availabilityReason: null,
      },
    ];

    mockCandidateGenerator.generate.mockResolvedValue(candidates);

    const result = await coordinator.getCandidates(defaultContext);

    expect(result).toEqual(candidates);
    expect(mockCandidateGenerator.generate).toHaveBeenCalledWith(defaultContext);
  });

  it("returns not_assigned when no candidates are generated", async () => {
    mockCandidateGenerator.generate.mockResolvedValue([]);

    const result = await coordinator.assign(defaultContext);

    expect(result.status).toBe("not_assigned");
    expect(result.reason).toBe("No available candidates found");
  });
});
