import { describe, it, expect } from "vitest";
import {
  InputValidationPolicy,
  SensitiveDataPolicy,
  ResourceOwnershipPolicy,
  OperationAuthorizationPolicy,
  SuspiciousActivityPolicy,
} from "../SecurityPolicy.js";
import { SecurityValidator } from "../SecurityValidator.js";
import { createSecurityContext } from "../SecurityContext.js";
import type { SecurityContext } from "../types.js";

function createContext(overrides: Partial<SecurityContext> = {}): SecurityContext {
  return createSecurityContext({
    userId: "user-1",
    organizationId: "org-1",
    roles: [{ roleId: "r1", roleCode: "manager", roleName: "Manager", restaurantId: "rest-1" }],
    permissions: ["reservation:read", "reservation:write"],
    restaurantId: "rest-1",
    ...overrides,
  });
}

describe("InputValidationPolicy", () => {
  it("passes for valid object data", async () => {
    const policy = new InputValidationPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { name: "test" });

    expect(result.passed).toBe(true);
  });

  it("fails for null data", async () => {
    const policy = new InputValidationPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, null);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("null or undefined");
  });

  it("fails for empty object", async () => {
    const policy = new InputValidationPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, {});

    expect(result.passed).toBe(false);
    expect(result.message).toContain("no properties");
  });

  it("fails for empty string", async () => {
    const policy = new InputValidationPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, "");

    expect(result.passed).toBe(false);
  });
});

describe("SensitiveDataPolicy", () => {
  it("passes for clean data", async () => {
    const policy = new SensitiveDataPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { name: "John", email: "john@test.com" });

    expect(result.passed).toBe(true);
  });

  it("detects sensitive fields in object keys", async () => {
    const policy = new SensitiveDataPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { password: "secret123" });

    expect(result.passed).toBe(false);
    expect(result.message).toContain("password");
  });

  it("detects sensitive patterns in strings", async () => {
    const policy = new SensitiveDataPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, "my api_key is secret");

    expect(result.passed).toBe(false);
  });

  it("passes for numeric data", async () => {
    const policy = new SensitiveDataPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, 42);

    expect(result.passed).toBe(true);
  });

  it("uses custom patterns when provided", async () => {
    const policy = new SensitiveDataPolicy("custom", true, [/customSecret/i]);
    const context = createContext();

    const result1 = await policy.evaluate(context, { customSecret: "value" });

    expect(result1.passed).toBe(false);

    const result2 = await policy.evaluate(context, { password: "value" });

    expect(result2.passed).toBe(true);
  });
});

describe("ResourceOwnershipPolicy", () => {
  it("passes when user owns the resource", async () => {
    const policy = new ResourceOwnershipPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { ownerUserId: "user-1" });

    expect(result.passed).toBe(true);
  });

  it("passes when restaurant matches", async () => {
    const policy = new ResourceOwnershipPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { restaurantId: "rest-1", ownerUserId: "user-1" });

    expect(result.passed).toBe(true);
  });

  it("fails when user does not own resource", async () => {
    const policy = new ResourceOwnershipPolicy();
    const context = createContext({ permissions: ["reservation:read"] });

    const result = await policy.evaluate(context, { ownerUserId: "other-user" });

    expect(result.passed).toBe(false);
    expect(result.message).toContain("other-user");
  });

  it("passes when user has admin permission for cross-ownership", async () => {
    const policy = new ResourceOwnershipPolicy();
    const context = createContext({ permissions: ["admin:manage"] });

    const result = await policy.evaluate(context, { ownerUserId: "other-user" });

    expect(result.passed).toBe(true);
  });

  it("fails when restaurant does not match", async () => {
    const policy = new ResourceOwnershipPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { restaurantId: "other-rest" });

    expect(result.passed).toBe(false);
  });

  it("passes when no ownership constraints exist", async () => {
    const policy = new ResourceOwnershipPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, {});

    expect(result.passed).toBe(true);
  });
});

describe("OperationAuthorizationPolicy", () => {
  it("passes when user has required permission", async () => {
    const policy = new OperationAuthorizationPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { requiredPermission: "reservation:read" });

    expect(result.passed).toBe(true);
  });

  it("passes for wildcard permission", async () => {
    const policy = new OperationAuthorizationPolicy();
    const context = createContext({ permissions: ["admin:*"] });

    const result = await policy.evaluate(context, { requiredPermission: "any:thing" });

    expect(result.passed).toBe(true);
  });

  it("fails when user lacks required permission", async () => {
    const policy = new OperationAuthorizationPolicy();
    const context = createContext({ permissions: ["menu:read"] });

    const result = await policy.evaluate(context, { requiredPermission: "billing:write" });

    expect(result.passed).toBe(false);
  });

  it("passes when no permission required", async () => {
    const policy = new OperationAuthorizationPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, {});

    expect(result.passed).toBe(true);
  });
});

describe("SuspiciousActivityPolicy", () => {
  it("passes for clean input", async () => {
    const policy = new SuspiciousActivityPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, "hello world");

    expect(result.passed).toBe(true);
  });

  it("detects SQL injection patterns", async () => {
    const policy = new SuspiciousActivityPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, "1' OR '1'='1");

    expect(result.passed).toBe(false);
    expect(result.message).toContain("Suspicious");
  });

  it("detects XSS patterns in nested objects", async () => {
    const policy = new SuspiciousActivityPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, { comment: "<script>alert('xss')</script>" });

    expect(result.passed).toBe(false);
  });

  it("detects path traversal patterns", async () => {
    const policy = new SuspiciousActivityPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, "../../etc/passwd");

    expect(result.passed).toBe(false);
  });

  it("recursively checks nested objects", async () => {
    const policy = new SuspiciousActivityPolicy();
    const context = createContext();

    const result = await policy.evaluate(context, {
      level1: {
        level2: {
          field: "<script>malicious()</script>",
        },
      },
    });

    expect(result.passed).toBe(false);
  });
});

describe("SecurityValidator", () => {
  it("returns passed when all policies pass", async () => {
    const validator = new SecurityValidator();
    const context = createContext();

    const result = await validator.validate(context, { name: "test" }, [
      new InputValidationPolicy(),
    ]);

    expect(result.passed).toBe(true);
    expect(result.failedPolicies).toHaveLength(0);
  });

  it("returns failed when any policy fails", async () => {
    const validator = new SecurityValidator();
    const context = createContext();

    const result = await validator.validate(context, null, [
      new InputValidationPolicy(),
    ]);

    expect(result.passed).toBe(false);
    expect(result.failedPolicies).toHaveLength(1);
  });

  it("skips disabled policies", async () => {
    const validator = new SecurityValidator();
    const context = createContext();

    const disabledPolicy = new InputValidationPolicy("disabled", false);

    const result = await validator.validate(context, null, [disabledPolicy]);

    expect(result.passed).toBe(true);
  });

  it("handles policy evaluation errors gracefully", async () => {
    const validator = new SecurityValidator();
    const context = createContext();
    const throwingPolicy = new InputValidationPolicy("throws", true);

    throwingPolicy.evaluate = async () => { throw new Error("oops"); };

    const result = await validator.validate(context, {}, [throwingPolicy]);

    expect(result.passed).toBe(false);
    expect(result.failedPolicies[0]!.message).toContain("oops");
  });
});
