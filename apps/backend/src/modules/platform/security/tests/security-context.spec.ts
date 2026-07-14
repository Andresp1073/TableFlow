import { describe, it, expect } from "vitest";
import { SecurityContextBuilder, createSecurityContext } from "../SecurityContext.js";
import type { SecurityContext } from "../types.js";

describe("SecurityContextBuilder", () => {
  it("builds a context with required fields", () => {
    const context = new SecurityContextBuilder()
      .withUserId("user-1")
      .withOrganizationId("org-1")
      .build();

    expect(context.userId).toBe("user-1");
    expect(context.organizationId).toBe("org-1");
    expect(context.roles).toEqual([]);
    expect(context.permissions).toEqual([]);
    expect(context.metadata).toBeDefined();
  });

  it("builds a context with all fields", () => {
    const context = new SecurityContextBuilder()
      .withUserId("user-1")
      .withOrganizationId("org-1")
      .withRoles([{ roleId: "r1", roleCode: "admin", roleName: "Admin", restaurantId: null }])
      .withPermissions(["reservation:read", "reservation:write"])
      .withRestaurantId("rest-1")
      .withTenantId("tenant-1")
      .withSessionId("session-1")
      .withRequestId("req-1")
      .withCorrelationId("corr-1")
      .withIpAddress("192.168.1.1")
      .withUserAgent("test-agent")
      .withMetadata("key1", "value1")
      .build();

    expect(context.userId).toBe("user-1");
    expect(context.organizationId).toBe("org-1");
    expect(context.roles).toHaveLength(1);
    expect(context.roles[0]!.roleCode).toBe("admin");
    expect(context.permissions).toContain("reservation:read");
    expect(context.restaurantId).toBe("rest-1");
    expect(context.tenantId).toBe("tenant-1");
    expect(context.sessionId).toBe("session-1");
    expect(context.requestId).toBe("req-1");
    expect(context.correlationId).toBe("corr-1");
    expect(context.ipAddress).toBe("192.168.1.1");
    expect(context.userAgent).toBe("test-agent");
    expect(context.metadata.key1).toBe("value1");
  });

  it("chaining works fluently", () => {
    const context = new SecurityContextBuilder()
      .withUserId("u1")
      .withOrganizationId("o1")
      .withPermissions(["p1"])
      .build();

    expect(context.userId).toBe("u1");
    expect(context.permissions).toEqual(["p1"]);
  });

  it("from() creates builder from partial context", () => {
    const partial: Partial<SecurityContext> = {
      userId: "user-1",
      organizationId: "org-1",
      restaurantId: "rest-1",
    };

    const context = SecurityContextBuilder.from(partial).build();

    expect(context.userId).toBe("user-1");
    expect(context.organizationId).toBe("org-1");
    expect(context.restaurantId).toBe("rest-1");
  });
});

describe("createSecurityContext", () => {
  it("creates a complete security context", () => {
    const context = createSecurityContext({
      userId: "u-1",
      organizationId: "o-1",
      roles: [{ roleId: "r1", roleCode: "manager", roleName: "Manager", restaurantId: "rest-1" }],
      permissions: ["menu:write"],
      restaurantId: "rest-1",
      sessionId: "sess-1",
      ipAddress: "10.0.0.1",
    });

    expect(context.userId).toBe("u-1");
    expect(context.roles[0]!.roleCode).toBe("manager");
    expect(context.permissions).toEqual(["menu:write"]);
    expect(context.restaurantId).toBe("rest-1");
    expect(context.metadata.createdAt).toBeDefined();
  });

  it("defaults empty values for optional fields", () => {
    const context = createSecurityContext({
      userId: "u-1",
      organizationId: "o-1",
    });

    expect(context.userId).toBe("u-1");
    expect(context.organizationId).toBe("o-1");
    expect(context.roles).toEqual([]);
    expect(context.permissions).toEqual([]);
    expect(context.restaurantId).toBe("");
    expect(context.tenantId).toBe("");
  });
});
