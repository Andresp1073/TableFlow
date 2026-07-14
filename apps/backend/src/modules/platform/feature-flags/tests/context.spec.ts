import { describe, it, expect } from "vitest";
import { createFeatureFlagContext, mergeContext } from "../FeatureFlagContext.js";

describe("FeatureFlagContext", () => {
  describe("createFeatureFlagContext", () => {
    it("creates context with default environment", () => {
      const ctx = createFeatureFlagContext();

      expect(ctx.environment).toBeDefined();
      expect(ctx.evaluatedAt).toBeInstanceOf(Date);
    });

    it("merges provided overrides with defaults", () => {
      const ctx = createFeatureFlagContext({
        userId: "user-1",
        tenantId: "tenant-1",
        roles: ["admin"],
      });

      expect(ctx.userId).toBe("user-1");
      expect(ctx.tenantId).toBe("tenant-1");
      expect(ctx.roles).toEqual(["admin"]);
    });

    it("sets evaluatedAt to current date", () => {
      const before = new Date();
      const ctx = createFeatureFlagContext({ userId: "u1" });
      const after = new Date();

      expect(ctx.evaluatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ctx.evaluatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("preserves request metadata", () => {
      const ctx = createFeatureFlagContext({
        requestMetadata: { ip: "127.0.0.1", userAgent: "test" },
      });

      expect(ctx.requestMetadata).toEqual({ ip: "127.0.0.1", userAgent: "test" });
    });
  });

  describe("mergeContext", () => {
    it("merges base context with overrides", () => {
      const base = createFeatureFlagContext({
        userId: "user-1",
        tenantId: "tenant-1",
        roles: ["admin"],
        permissions: ["read"],
      });

      const merged = mergeContext(base, { userId: "user-2", roles: ["editor"] });

      expect(merged.userId).toBe("user-2");
      expect(merged.tenantId).toBe("tenant-1");
      expect(merged.roles).toEqual(["editor"]);
      expect(merged.permissions).toEqual(["read"]);
    });

    it("updates evaluatedAt on merge", () => {
      const base = createFeatureFlagContext({ userId: "u1" });
      const baseTime = base.evaluatedAt.getTime();

      const merged = mergeContext(base, { userId: "u1" });

      expect(merged.evaluatedAt.getTime()).toBeGreaterThanOrEqual(baseTime);
    });

    it("deep merges request metadata", () => {
      const base = createFeatureFlagContext({
        requestMetadata: { ip: "127.0.0.1", existingField: "value" },
      });

      const merged = mergeContext(base, {
        requestMetadata: { ip: "10.0.0.1", newField: "new-value" },
      });

      expect(merged.requestMetadata).toEqual({
        ip: "10.0.0.1",
        existingField: "value",
        newField: "new-value",
      });
    });

    it("creates a new object without mutating base", () => {
      const base = createFeatureFlagContext({ userId: "u1", roles: ["admin"] });
      const merged = mergeContext(base, { userId: "u2" });

      expect(base.userId).toBe("u1");
      expect(merged.userId).toBe("u2");
    });
  });
});
