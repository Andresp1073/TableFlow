import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeatureFlagManager } from "../FeatureFlagManager.js";
import { FeatureFlagNotFoundError, FeatureFlagValidationError } from "../errors.js";
import type { FeatureFlag } from "../types.js";

describe("FeatureFlagManager", () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    manager = new FeatureFlagManager();
  });

  function createFlag(overrides?: Partial<FeatureFlag>): FeatureFlag {
    return {
      key: "test-flag",
      name: "Test Flag",
      type: "boolean",
      defaultValue: false,
      rules: [{ type: "boolean", priority: 10, value: true }],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      ...overrides,
    };
  }

  describe("registerFlag", () => {
    it("registers a flag and returns it", () => {
      const flag = createFlag();
      const result = manager.registerFlag(flag);

      expect(result.key).toBe("test-flag");
      expect(result.version).toBe(1);
      expect(manager.getFlag("test-flag")).not.toBeNull();
    });

    it("throws validation error for invalid key", () => {
      expect(() => manager.registerFlag(createFlag({ key: "" }))).toThrow(FeatureFlagValidationError);
    });

    it("throws validation error for missing name", () => {
      expect(() => manager.registerFlag(createFlag({ name: "" }))).toThrow(FeatureFlagValidationError);
    });

    it("throws validation error for invalid type", () => {
      expect(() => manager.registerFlag(createFlag({ type: "invalid" as "boolean" }))).toThrow(FeatureFlagValidationError);
    });
  });

  describe("updateFlag", () => {
    it("updates an existing flag", () => {
      manager.registerFlag(createFlag());

      manager.updateFlag("test-flag", { enabled: false });

      const updated = manager.getFlag("test-flag");

      expect(updated!.enabled).toBe(false);
      expect(updated!.version).toBe(2);
    });

    it("throws when flag does not exist", () => {
      expect(() => manager.updateFlag("nonexistent", { enabled: false })).toThrow(FeatureFlagNotFoundError);
    });
  });

  describe("deleteFlag", () => {
    it("deletes an existing flag", () => {
      manager.registerFlag(createFlag());
      manager.deleteFlag("test-flag");

      expect(manager.getFlag("test-flag")).toBeNull();
    });

    it("throws when flag does not exist", () => {
      expect(() => manager.deleteFlag("nonexistent")).toThrow(FeatureFlagNotFoundError);
    });
  });

  describe("getAllFlags", () => {
    it("returns all registered flags", () => {
      manager.registerFlag(createFlag({ key: "flag-a" }));
      manager.registerFlag(createFlag({ key: "flag-b" }));

      const flags = manager.getAllFlags();

      expect(flags).toHaveLength(2);
    });

    it("returns empty array when no flags registered", () => {
      expect(manager.getAllFlags()).toHaveLength(0);
    });
  });

  describe("evaluate", () => {
    it("evaluates a registered flag", async () => {
      manager.registerFlag(createFlag());

      const decision = await manager.evaluate("test-flag");

      expect(decision.key).toBe("test-flag");
      expect(decision.enabled).toBe(true);
    });

    it("throws when flag is not registered", async () => {
      await expect(manager.evaluate("nonexistent")).rejects.toThrow(FeatureFlagNotFoundError);
    });

    it("passes context to evaluator", async () => {
      manager.registerFlag(createFlag({
        rules: [{ type: "role", priority: 10, roles: ["admin"], mode: "allow" }],
      }));

      const decision = await manager.evaluate("test-flag", { roles: ["admin"] });

      expect(decision.enabled).toBe(true);
    });
  });

  describe("provider interface", () => {
    it("isEnabled returns boolean", async () => {
      manager.registerFlag(createFlag());

      const result = await manager.provider.isEnabled("test-flag");

      expect(result).toBe(true);
    });

    it("getValue returns flag value", async () => {
      manager.registerFlag(createFlag({
        type: "boolean",
        defaultValue: true,
        rules: [{ type: "boolean", priority: 10, value: true }],
      }));

      const value = await manager.provider.getValue<boolean>("test-flag");

      expect(value).toBe(true);
    });

    it("evaluate returns decision", async () => {
      manager.registerFlag(createFlag());

      const decision = await manager.provider.evaluate("test-flag");

      expect(decision.key).toBe("test-flag");
    });

    it("getFlag returns flag", async () => {
      manager.registerFlag(createFlag());

      const flag = await manager.provider.getFlag("test-flag");

      expect(flag).not.toBeNull();
      expect(flag!.key).toBe("test-flag");
    });

    it("getAllFlags returns all flags", async () => {
      manager.registerFlag(createFlag({ key: "flag-1" }));
      manager.registerFlag(createFlag({ key: "flag-2" }));

      const flags = await manager.provider.getAllFlags();

      expect(flags).toHaveLength(2);
    });
  });
});
