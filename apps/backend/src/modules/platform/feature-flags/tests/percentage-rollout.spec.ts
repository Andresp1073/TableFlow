import { describe, it, expect } from "vitest";
import { FeatureFlagEvaluator } from "../FeatureFlagEvaluator.js";
import { createFeatureFlagContext } from "../FeatureFlagContext.js";
import type { FeatureFlag } from "../types.js";

describe("Percentage Rollout", () => {
  const evaluator = new FeatureFlagEvaluator();

  function createFlag(key: string, percentage: number, overrides?: Partial<FeatureFlag>): FeatureFlag {
    return {
      key,
      name: key,
      type: "boolean",
      defaultValue: false,
      rules: [{ type: "percentage", priority: 10, percentage, sticky: true, entityField: "userId" }],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      ...overrides,
    };
  }

  it("0% never enables", () => {
    const flag = createFlag("pct-0", 0);

    for (let i = 0; i < 50; i++) {
      const d = evaluator.evaluate(flag, createFeatureFlagContext({ userId: `user-${i}` }));
      expect(d.enabled).toBe(false);
    }
  });

  it("100% always enables", () => {
    const flag = createFlag("pct-100", 100);

    for (let i = 0; i < 50; i++) {
      const d = evaluator.evaluate(flag, createFeatureFlagContext({ userId: `user-${i}` }));
      expect(d.enabled).toBe(true);
    }
  });

  it("50% enables approximately half", () => {
    const flag = createFlag("pct-50", 50);
    let enabledCount = 0;
    const total = 1000;

    for (let i = 0; i < total; i++) {
      const d = evaluator.evaluate(flag, createFeatureFlagContext({ userId: `user-${i}` }));
      if (d.enabled) { enabledCount++; }
    }

    const ratio = enabledCount / total;

    expect(ratio).toBeGreaterThan(0.35);
    expect(ratio).toBeLessThan(0.65);
  });

  it("same user gets consistent result across evaluations", () => {
    const flag = createFlag("pct-30", 30);
    const ctx = createFeatureFlagContext({ userId: "consistent-user" });

    const results = new Set<boolean>();

    for (let i = 0; i < 10; i++) {
      results.add(evaluator.evaluate(flag, ctx).enabled);
    }

    expect(results.size).toBe(1);
  });

  it("different flags produce independent distributions", () => {
    const flagA = createFlag("flag-a", 50);
    const flagB = createFlag("flag-b", 50);

    let aEnabled = 0;
    let bEnabled = 0;

    for (let i = 0; i < 100; i++) {
      const ctx = createFeatureFlagContext({ userId: `user-${i}` });
      if (evaluator.evaluate(flagA, ctx).enabled) { aEnabled++; }
      if (evaluator.evaluate(flagB, ctx).enabled) { bEnabled++; }
    }

    expect(aEnabled).toBeGreaterThan(30);
    expect(aEnabled).toBeLessThan(70);
    expect(bEnabled).toBeGreaterThan(30);
    expect(bEnabled).toBeLessThan(70);
  });

  it("uses tenant ID when userId is not available", () => {
    const flag = createFlag("tenant-rollout", 50);
    const results = new Set<boolean>();

    for (let i = 0; i < 50; i++) {
      const d = evaluator.evaluate(flag, createFeatureFlagContext({ tenantId: `tenant-${i}` }));
      results.add(d.enabled);
    }

    expect(results.has(true)).toBe(true);
    expect(results.has(false)).toBe(true);
  });

  it("returns disabled when no entity ID is available", () => {
    const flag = createFlag("no-entity", 100);
    const d = evaluator.evaluate(flag, createFeatureFlagContext({}));

    expect(d.enabled).toBe(false);
  });
});
