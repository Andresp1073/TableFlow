import { describe, it, expect } from "vitest";
import { PermissionEvaluatorImpl } from "./PermissionEvaluatorImpl.js";
import type { AuthorizationContext } from "../../../domain/models/AuthorizationContext.js";

function makeContext(overrides?: Partial<AuthorizationContext>): AuthorizationContext {
  return {
    userId: "user-1",
    organizationId: "org-1",
    roles: [],
    permissions: ["users.read", "users.write", "orders.read"],
    scope: { type: "organization", organizationId: "org-1" },
    ...overrides,
  };
}

describe("PermissionEvaluatorImpl", () => {
  const evaluator = new PermissionEvaluatorImpl();

  describe("hasPermission", () => {
    it("returns true when permission is granted", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasPermission(ctx, "users.read");
      expect(result).toBe(true);
    });

    it("returns false when permission is not granted", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasPermission(ctx, "billing.delete");
      expect(result).toBe(false);
    });

    it("is case-sensitive", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasPermission(ctx, "USERS.READ");
      expect(result).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true when any permission matches", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasAnyPermission(ctx, "billing.delete", "users.write", "reports.view");
      expect(result).toBe(true);
    });

    it("returns false when no permission matches", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasAnyPermission(ctx, "billing.delete", "reports.view");
      expect(result).toBe(false);
    });

    it("returns true with single matching permission", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasAnyPermission(ctx, "orders.read");
      expect(result).toBe(true);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true when all permissions match", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasAllPermissions(ctx, "users.read", "users.write");
      expect(result).toBe(true);
    });

    it("returns false when any permission is missing", async () => {
      const ctx = makeContext();
      const result = await evaluator.hasAllPermissions(ctx, "users.read", "billing.delete");
      expect(result).toBe(false);
    });
  });

  describe("evaluateScope", () => {
    it("global scope has access everywhere", async () => {
      const ctx = makeContext({ scope: { type: "global" } });
      expect(await evaluator.evaluateScope(ctx, "org-999")).toBe(true);
    });

    it("organization scope matches same org", async () => {
      const ctx = makeContext({ scope: { type: "organization", organizationId: "org-1" } });
      expect(await evaluator.evaluateScope(ctx, "org-1")).toBe(true);
    });

    it("organization scope denies different org", async () => {
      const ctx = makeContext({ scope: { type: "organization", organizationId: "org-1" } });
      expect(await evaluator.evaluateScope(ctx, "org-2")).toBe(false);
    });

    it("branch scope matches same branch", async () => {
      const ctx = makeContext({ scope: { type: "branch", organizationId: "org-1", branchId: "branch-1" } });
      expect(await evaluator.evaluateScope(ctx, "org-1", "branch-1")).toBe(true);
    });

    it("branch scope denies different branch", async () => {
      const ctx = makeContext({ scope: { type: "branch", organizationId: "org-1", branchId: "branch-1" } });
      expect(await evaluator.evaluateScope(ctx, "org-1", "branch-2")).toBe(false);
    });
  });
});
