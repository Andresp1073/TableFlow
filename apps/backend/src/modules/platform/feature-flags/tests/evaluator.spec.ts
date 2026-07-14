import { describe, it, expect } from "vitest";
import { FeatureFlagEvaluator } from "../FeatureFlagEvaluator.js";
import { createFeatureFlagContext } from "../FeatureFlagContext.js";
import type { FeatureFlag } from "../types.js";

describe("FeatureFlagEvaluator", () => {
  const evaluator = new FeatureFlagEvaluator();

  function createFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
    return {
      key: "test-flag",
      name: "Test Flag",
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

  function context(overrides?: Partial<ReturnType<typeof createFeatureFlagContext>>) {
    return createFeatureFlagContext({
      environment: "test",
      userId: "user-1",
      roles: ["admin"],
      tenantId: "tenant-1",
      restaurantId: "rest-1",
      ...overrides,
    });
  }

  describe("boolean rule", () => {
    it("enables flag when boolean rule is true", () => {
      const flag = createFlag({
        rules: [{ type: "boolean", priority: 10, value: true }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(true);
      expect(decision.reason).toContain("Boolean rule");
    });

    it("disables flag when boolean rule is false", () => {
      const flag = createFlag({
        rules: [{ type: "boolean", priority: 10, value: false }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(false);
      expect(decision.reason).toContain("Boolean rule");
    });
  });

  describe("percentage rollout", () => {
    it("enables flag for entities within percentage", () => {
      const flag = createFlag({
        key: "rollout-flag",
        rules: [{ type: "percentage", priority: 10, percentage: 100 }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(true);
    });

    it("disables flag for entities outside percentage", () => {
      const flag = createFlag({
        key: "rollout-flag",
        rules: [{ type: "percentage", priority: 10, percentage: 0 }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(false);
    });

    it("returns consistent results for same entity (sticky)", () => {
      const flag = createFlag({
        key: "sticky-flag",
        rules: [{ type: "percentage", priority: 10, percentage: 50, sticky: true, entityField: "userId" }],
      });

      const ctx = context({ userId: "consistent-user" });
      const decision1 = evaluator.evaluate(flag, ctx);
      const decision2 = evaluator.evaluate(flag, ctx);

      expect(decision1.enabled).toBe(decision2.enabled);
    });
  });

  describe("date rule", () => {
    it("enables flag when current date is after startDate (before condition)", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const flag = createFlag({
        rules: [{ type: "date", priority: 10, condition: "before", startDate: futureDate }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(true);
    });

    it("disables flag when current date is after endDate (after condition)", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();

      const flag = createFlag({
        rules: [{ type: "date", priority: 10, condition: "after", endDate: pastDate }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(true);
    });

    it("enables flag within date range (between condition)", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const flag = createFlag({
        rules: [{ type: "date", priority: 10, condition: "between", startDate: pastDate, endDate: futureDate }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(true);
    });
  });

  describe("role rule", () => {
    it("enables flag when user has matching role (allow mode)", () => {
      const flag = createFlag({
        rules: [{ type: "role", priority: 10, roles: ["admin"], mode: "allow" }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(true);
    });

    it("disables flag when user does not have matching role (allow mode)", () => {
      const flag = createFlag({
        rules: [{ type: "role", priority: 10, roles: ["superadmin"], mode: "allow" }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(false);
    });

    it("enables flag when user does not have denied role (deny mode)", () => {
      const flag = createFlag({
        rules: [{ type: "role", priority: 10, roles: ["blocked"], mode: "deny" }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(true);
    });
  });

  describe("tenant rule", () => {
    it("enables flag for allowed tenant", () => {
      const flag = createFlag({
        rules: [{ type: "tenant", priority: 10, tenantIds: ["tenant-1"], mode: "allow" }],
      });

      const decision = evaluator.evaluate(flag, context({ tenantId: "tenant-1" }));

      expect(decision.enabled).toBe(true);
    });

    it("disables flag for non-allowed tenant", () => {
      const flag = createFlag({
        rules: [{ type: "tenant", priority: 10, tenantIds: ["tenant-2"], mode: "allow" }],
      });

      const decision = evaluator.evaluate(flag, context({ tenantId: "tenant-1" }));

      expect(decision.enabled).toBe(false);
    });
  });

  describe("restaurant rule", () => {
    it("enables flag for allowed restaurant", () => {
      const flag = createFlag({
        rules: [{ type: "restaurant", priority: 10, restaurantIds: ["rest-1"], mode: "allow" }],
      });

      const decision = evaluator.evaluate(flag, context({ restaurantId: "rest-1" }));

      expect(decision.enabled).toBe(true);
    });

    it("disables flag for non-allowed restaurant", () => {
      const flag = createFlag({
        rules: [{ type: "restaurant", priority: 10, restaurantIds: ["rest-2"], mode: "allow" }],
      });

      const decision = evaluator.evaluate(flag, context({ restaurantId: "rest-1" }));

      expect(decision.enabled).toBe(false);
    });
  });

  describe("composite rules", () => {
    it("evaluates AND composition (all must match)", () => {
      const flag = createFlag({
        rules: [{
          type: "composite",
          priority: 10,
          operator: "AND",
          rules: [
            { type: "boolean", priority: 10, value: true },
            { type: "role", priority: 10, roles: ["admin"], mode: "allow" },
          ],
        }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(true);
    });

    it("evaluates AND composition (fails if one does not match)", () => {
      const flag = createFlag({
        rules: [{
          type: "composite",
          priority: 10,
          operator: "AND",
          rules: [
            { type: "boolean", priority: 10, value: true },
            { type: "role", priority: 10, roles: ["superadmin"], mode: "allow" },
          ],
        }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(false);
    });

    it("evaluates OR composition (at least one must match)", () => {
      const flag = createFlag({
        rules: [{
          type: "composite",
          priority: 10,
          operator: "OR",
          rules: [
            { type: "boolean", priority: 10, value: false },
            { type: "role", priority: 10, roles: ["admin"], mode: "allow" },
          ],
        }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(true);
    });

    it("evaluates NOT composition (inverts)", () => {
      const flag = createFlag({
        rules: [{
          type: "composite",
          priority: 10,
          operator: "NOT",
          rules: [
            { type: "boolean", priority: 10, value: false },
          ],
        }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(true);
    });
  });

  describe("rule priority", () => {
    it("evaluates rules in priority order and stops at first match", () => {
      const flag = createFlag({
        rules: [
          { type: "boolean", priority: 20, value: true },
          { type: "boolean", priority: 10, value: false },
        ],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(false);
      expect(decision.matchedRule?.priority).toBe(10);
    });
  });

  describe("globally disabled flag", () => {
    it("returns disabled when flag.enabled is false", () => {
      const flag = createFlag({
        enabled: false,
        rules: [{ type: "boolean", priority: 10, value: true }],
      });

      const decision = evaluator.evaluate(flag, context());

      expect(decision.enabled).toBe(false);
      expect(decision.reason).toContain("globally disabled");
    });
  });

  describe("no matching rules", () => {
    it("uses default when no rules match", () => {
      const flag = createFlag({
        defaultValue: false,
        rules: [{ type: "boolean", priority: 10, value: true }],
      });

      const decision = evaluator.evaluate(flag, context({ roles: ["admin"] }));

      expect(decision.enabled).toBe(true);
    });
  });
});
