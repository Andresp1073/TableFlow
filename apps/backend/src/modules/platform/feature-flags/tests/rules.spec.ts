import { describe, it, expect } from "vitest";
import { FeatureFlagEvaluator } from "../FeatureFlagEvaluator.js";
import { createFeatureFlagContext } from "../FeatureFlagContext.js";
import type { FeatureFlag } from "../types.js";

describe("FeatureFlagRules", () => {
  const evaluator = new FeatureFlagEvaluator();

  function createFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
    return {
      key: "rule-test",
      name: "Rule Test",
      type: "boolean",
      defaultValue: false,
      rules: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      ...overrides,
    };
  }

  function ctx(overrides?: Record<string, unknown>) {
    return createFeatureFlagContext(overrides as Parameters<typeof createFeatureFlagContext>[0]);
  }

  describe("BooleanRule", () => {
    it("returns enabled=true for value=true", () => {
      const flag = createFlag({ rules: [{ type: "boolean", priority: 10, value: true }] });
      const d = evaluator.evaluate(flag, ctx());
      expect(d.enabled).toBe(true);
    });

    it("returns enabled=false for value=false", () => {
      const flag = createFlag({ rules: [{ type: "boolean", priority: 10, value: false }] });
      const d = evaluator.evaluate(flag, ctx());
      expect(d.enabled).toBe(false);
    });

    it("includes rule metadata in decision", () => {
      const flag = createFlag({ rules: [{ type: "boolean", priority: 10, value: true }] });
      const d = evaluator.evaluate(flag, ctx());
      expect(d.matchedRule).toBeDefined();
      expect(d.matchedRule!.type).toBe("boolean");
    });
  });

  describe("PercentageRule", () => {
    it("returns disabled for 0%", () => {
      const flag = createFlag({
        key: "pct-0",
        rules: [{ type: "percentage", priority: 10, percentage: 0 }],
      });
      const d = evaluator.evaluate(flag, ctx({ userId: "any-user" }));
      expect(d.enabled).toBe(false);
    });

    it("returns enabled for 100%", () => {
      const flag = createFlag({
        key: "pct-100",
        rules: [{ type: "percentage", priority: 10, percentage: 100 }],
      });
      const d = evaluator.evaluate(flag, ctx({ userId: "any-user" }));
      expect(d.enabled).toBe(true);
    });

    it("distributes across different users", () => {
      const flag = createFlag({
        key: "pct-50",
        rules: [{ type: "percentage", priority: 10, percentage: 50 }],
      });

      const results = new Set<boolean>();

      for (let i = 0; i < 100; i++) {
        const d = evaluator.evaluate(flag, ctx({ userId: `user-${i}` }));
        results.add(d.enabled);
      }

      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });

    it("uses sticky entity field when configured", () => {
      const flag = createFlag({
        key: "sticky-tenant",
        rules: [{
          type: "percentage",
          priority: 10,
          percentage: 50,
          sticky: true,
          entityField: "tenantId",
        }],
      });

      const d1 = evaluator.evaluate(flag, ctx({ tenantId: "tenant-alpha" }));
      const d2 = evaluator.evaluate(flag, ctx({ tenantId: "tenant-alpha" }));

      expect(d1.enabled).toBe(d2.enabled);
    });
  });

  describe("DateRule", () => {
    it("before condition: active when current < startDate", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const flag = createFlag({ rules: [{ type: "date", priority: 10, condition: "before", startDate: future }] });
      expect(evaluator.evaluate(flag, ctx()).enabled).toBe(true);
    });

    it("after condition: active when current > endDate", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const flag = createFlag({ rules: [{ type: "date", priority: 10, condition: "after", endDate: past }] });
      expect(evaluator.evaluate(flag, ctx()).enabled).toBe(true);
    });

    it("between condition: active when current in range", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();
      const flag = createFlag({ rules: [{ type: "date", priority: 10, condition: "between", startDate: past, endDate: future }] });
      expect(evaluator.evaluate(flag, ctx()).enabled).toBe(true);
    });

    it("returns disabled when missing required date fields", () => {
      const flag = createFlag({ rules: [{ type: "date", priority: 10, condition: "before" }] });
      const d = evaluator.evaluate(flag, ctx());
      expect(d.enabled).toBe(false);
    });
  });

  describe("RoleRule", () => {
    it("allow: matches when user has role", () => {
      const flag = createFlag({ rules: [{ type: "role", priority: 10, roles: ["editor"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ roles: ["editor"] })).enabled).toBe(true);
    });

    it("allow: does not match when user lacks role", () => {
      const flag = createFlag({ rules: [{ type: "role", priority: 10, roles: ["editor"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ roles: ["viewer"] })).enabled).toBe(false);
    });

    it("deny: blocks users with the role", () => {
      const flag = createFlag({ rules: [{ type: "role", priority: 10, roles: ["blocked"], mode: "deny" }] });
      expect(evaluator.evaluate(flag, ctx({ roles: ["blocked"] })).enabled).toBe(false);
    });

    it("deny: allows users without the role", () => {
      const flag = createFlag({ rules: [{ type: "role", priority: 10, roles: ["blocked"], mode: "deny" }] });
      expect(evaluator.evaluate(flag, ctx({ roles: ["admin"] })).enabled).toBe(true);
    });

    it("returns disabled when no roles in context", () => {
      const flag = createFlag({ rules: [{ type: "role", priority: 10, roles: ["admin"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ roles: [] })).enabled).toBe(false);
    });
  });

  describe("TenantRule", () => {
    it("allow: matches listed tenant", () => {
      const flag = createFlag({ rules: [{ type: "tenant", priority: 10, tenantIds: ["t1", "t2"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ tenantId: "t1" })).enabled).toBe(true);
      expect(evaluator.evaluate(flag, ctx({ tenantId: "t2" })).enabled).toBe(true);
    });

    it("allow: does not match unlisted tenant", () => {
      const flag = createFlag({ rules: [{ type: "tenant", priority: 10, tenantIds: ["t1"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ tenantId: "t3" })).enabled).toBe(false);
    });

    it("deny: blocks listed tenants", () => {
      const flag = createFlag({ rules: [{ type: "tenant", priority: 10, tenantIds: ["blocked-tenant"], mode: "deny" }] });
      expect(evaluator.evaluate(flag, ctx({ tenantId: "blocked-tenant" })).enabled).toBe(false);
    });
  });

  describe("RestaurantRule", () => {
    it("allow: matches listed restaurant", () => {
      const flag = createFlag({ rules: [{ type: "restaurant", priority: 10, restaurantIds: ["r1"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ restaurantId: "r1" })).enabled).toBe(true);
    });

    it("allow: does not match unlisted restaurant", () => {
      const flag = createFlag({ rules: [{ type: "restaurant", priority: 10, restaurantIds: ["r1"], mode: "allow" }] });
      expect(evaluator.evaluate(flag, ctx({ restaurantId: "r2" })).enabled).toBe(false);
    });
  });
});
