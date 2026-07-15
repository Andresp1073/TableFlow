import { describe, it, expect } from "vitest";
import { OptimizationEngineImpl } from "../OptimizationEngine.js";
import { PerformanceProfileBuilder } from "../PerformanceProfile.js";
import type { Bottleneck, PerformanceProfile } from "../types.js";
import { OptimizationError, PerformanceValidationError } from "../errors.js";

describe("OptimizationEngineImpl", () => {
  const engine = new OptimizationEngineImpl();

  const testBottleneck: Bottleneck = {
    id: "b1",
    type: "high_latency",
    severity: "critical",
    resource: "api_response",
    description: "High latency on api_response (600ms)",
    currentValue: 600,
    threshold: 500,
    impact: "Exceeds SLO targets",
    evidence: ["Value: 600", "Type: latency"],
    detectedAt: new Date(),
    affectedOperations: ["api_response"],
    suggestedOptimizations: ["caching", "compression", "lazy_loading"],
  };

  const testProfile: PerformanceProfile = PerformanceProfileBuilder.createDefault("test").build();

  it("suggests optimizations from bottlenecks", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    expect(recommendations.length).toBeGreaterThanOrEqual(1);
    expect(recommendations[0]!.area).toBeDefined();
    expect(recommendations[0]!.status).toBe("pending");
  });

  it("suggests multiple optimization areas from single bottleneck", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    const areas = new Set(recommendations.map((r) => r.area));
    expect(areas.has("caching")).toBe(true);
    expect(areas.has("compression")).toBe(true);
    expect(areas.has("lazy_loading")).toBe(true);
  });

  it("filters recommendations by optimization areas", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile, { areas: ["caching"] });
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]!.area).toBe("caching");
  });

  it("filters by maximum effort", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile, { maxEffort: "hours" });
    for (const rec of recommendations) {
      expect(rec.effort).toBe("hours");
    }
  });

  it("applies a recommendation", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    const rec = recommendations[0]!;
    const applied = engine.apply(rec);
    expect(applied.status).toBe("applied");
    expect(applied.appliedAt).toBeInstanceOf(Date);
  });

  it("throws when applying an already applied recommendation", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    const applied = engine.apply(recommendations[0]!);
    expect(() => engine.apply(applied)).toThrow(OptimizationError);
  });

  it("dismisses a recommendation", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    const dismissed = engine.dismiss(recommendations[0]!);
    expect(dismissed.status).toBe("dismissed");
  });

  it("throws when dismissing an already applied recommendation", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    const applied = engine.apply(recommendations[0]!);
    expect(() => engine.dismiss(applied)).toThrow(OptimizationError);
  });

  it("retrieves a recommendation by ID", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    const rec = recommendations[0]!;
    const retrieved = engine.getRecommendation(rec.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(rec.id);
  });

  it("returns undefined for unknown recommendation ID", () => {
    expect(engine.getRecommendation("unknown")).toBeUndefined();
  });

  it("lists all recommendations", () => {
    engine.suggest([testBottleneck], testProfile);
    const all = engine.listRecommendations();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it("filters recommendations by status", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    engine.apply(recommendations[0]!);
    const pending = engine.listRecommendations("pending");
    const applied = engine.listRecommendations("applied");
    expect(pending.length).toBeGreaterThanOrEqual(2);
    expect(applied.length).toBeGreaterThanOrEqual(1);
  });

  it("provides implementation steps for each area", () => {
    const recommendations = engine.suggest([testBottleneck], testProfile);
    for (const rec of recommendations) {
      expect(rec.implementation.length).toBeGreaterThan(0);
      expect(rec.prerequisites.length).toBeGreaterThan(0);
    }
  });

  it("throws on empty bottlenecks array", () => {
    expect(() => engine.suggest([], testProfile)).toThrow(PerformanceValidationError);
  });
});
