import { describe, it, expect } from "vitest";
import { AssignmentScoringEngine } from "../../../engine/assignment/AssignmentScoringEngine.js";

function createCandidate(overrides: Record<string, unknown> = {}) {
  return {
    tableId: "table-1",
    partySize: 4,
    isTableGroup: overrides.isTableGroup === undefined ? false : (overrides.isTableGroup as boolean),
    tableGroupId: null,
    diningAreaId: overrides.diningAreaId === undefined ? "area-1" : overrides.diningAreaId,
    tableTypeId: "type-1",
    minimumCapacity: overrides.minimumCapacity === undefined ? 2 : (overrides.minimumCapacity as number),
    maximumCapacity: overrides.maximumCapacity === undefined ? 4 : (overrides.maximumCapacity as number),
    isAccessible: overrides.isAccessible === undefined ? false : (overrides.isAccessible as boolean),
    isAvailable: overrides.isAvailable === undefined ? true : (overrides.isAvailable as boolean),
    availabilityReason: overrides.availabilityReason === undefined ? null : (overrides.availabilityReason as string | null),
  };
}

const defaultContext = {
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
};

describe("AssignmentScoringEngine", () => {
  describe("capacity fit", () => {
    it("returns 1.0 when party size matches maximum capacity exactly", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 4 });

      const score = engine.score(candidate, defaultContext);

      expect(score.capacityFit).toBe(1.0);
    });

    it("returns lower score when wasted capacity is high", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 8 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 3 });

      expect(score.capacityFit).toBeLessThan(0.5);
    });

    it("returns 0 when party size exceeds maximum capacity", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 4 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 6 });

      expect(score.capacityFit).toBe(0);
    });

    it("returns 0 when party size is below minimum capacity", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 4, maximumCapacity: 8 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 2 });

      expect(score.capacityFit).toBe(0);
    });

    it("returns 1.0 when capacity range is 0 (single-size table)", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 4, maximumCapacity: 4 });

      const score = engine.score(candidate, defaultContext);

      expect(score.capacityFit).toBe(1.0);
    });
  });

  describe("availability quality", () => {
    it("returns 1.0 for available tables", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ isAvailable: true });

      const score = engine.score(candidate, defaultContext);

      expect(score.availabilityQuality).toBe(1.0);
    });

    it("returns 0.0 for unavailable tables", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ isAvailable: false });

      const score = engine.score(candidate, defaultContext);

      expect(score.availabilityQuality).toBe(0.0);
    });

    it("returns 0.3 for unavailable table groups", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ isAvailable: false, isTableGroup: true });

      const score = engine.score(candidate, defaultContext);

      expect(score.availabilityQuality).toBe(0.3);
    });
  });

  describe("dining area fit", () => {
    it("returns 1.0 when dining area matches preference", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ diningAreaId: "area-1" });

      const score = engine.score(candidate, { ...defaultContext, preferredDiningAreaId: "area-1" });

      expect(score.diningAreaFit).toBe(1.0);
    });

    it("returns 0.0 when dining area does not match", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ diningAreaId: "area-1" });

      const score = engine.score(candidate, { ...defaultContext, preferredDiningAreaId: "area-2" });

      expect(score.diningAreaFit).toBe(0.0);
    });

    it("returns 0.5 when no preference is specified", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ diningAreaId: "area-1" });

      const score = engine.score(candidate, defaultContext);

      expect(score.diningAreaFit).toBe(0.5);
    });
  });

  describe("utilization score", () => {
    it("returns 1.0 when party size matches max capacity", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 4, maximumCapacity: 4 });

      const score = engine.score(candidate, defaultContext);

      expect(score.utilizationScore).toBe(1.0);
    });

    it("returns ratio when utilization is >= 0.7", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 6 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 5 });

      expect(score.utilizationScore).toBeCloseTo(0.83, 1);
    });

    it("returns 0.6 when utilization is between 0.5 and 0.7", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 6 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 3 });

      expect(score.utilizationScore).toBe(0.6);
    });

    it("returns 0.3 when utilization is between 0.3 and 0.5", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 8 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 3 });

      expect(score.utilizationScore).toBe(0.3);
    });

    it("returns 0.1 when utilization is below 0.3", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 10 });

      const score = engine.score(candidate, { ...defaultContext, partySize: 2 });

      expect(score.utilizationScore).toBe(0.1);
    });
  });

  describe("total score calculation", () => {
    it("combines all factors with default weights", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 4 });

      const score = engine.score(candidate, defaultContext);

      const expected =
        1.0 * 0.35 + 1.0 * 0.30 + 0.5 * 0.15 + 1.0 * 0.20;

      expect(score.totalScore).toBeCloseTo(expected, 2);
    });

    it("returns score with candidate reference", () => {
      const engine = new AssignmentScoringEngine();
      const candidate = createCandidate();

      const score = engine.score(candidate, defaultContext);

      expect(score.candidate).toBe(candidate);
    });
  });

  describe("custom factors", () => {
    it("uses custom factor weights", () => {
      const engine = new AssignmentScoringEngine({
        capacityFitWeight: 0.5,
        availabilityWeight: 0.5,
        diningAreaWeight: 0,
        utilizationWeight: 0,
      });

      const candidate = createCandidate({ minimumCapacity: 2, maximumCapacity: 4 });

      const score = engine.score(candidate, defaultContext);

      const expected = 1.0 * 0.5 + 1.0 * 0.5;

      expect(score.totalScore).toBeCloseTo(expected, 2);
    });

    it("withFactors creates new engine with merged factors", () => {
      const engine = new AssignmentScoringEngine();
      const custom = engine.withFactors({ capacityFitWeight: 0.5 });

      expect(custom).toBeInstanceOf(AssignmentScoringEngine);
      expect(custom.getFactors().capacityFitWeight).toBe(0.5);
      expect(custom.getFactors().availabilityWeight).toBe(0.30);
    });
  });
});
