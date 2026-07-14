import { describe, it, expect } from "vitest";
import { ProtectionContextBuilder, createProtectionContext } from "../ProtectionContext.js";
import type { SecurityContext } from "../../security/types.js";

describe("ProtectionContextBuilder", () => {
  it("builds context with all fields", () => {
    const ctx = new ProtectionContextBuilder()
      .withRequestId("req_123")
      .withMethod("POST")
      .withPath("/api/reservations")
      .withHeader("content-type", "application/json")
      .withHeaders({ "x-custom": "value" })
      .withQuery({ page: "1" })
      .withBody({ name: "test" })
      .withContentType("application/json")
      .withContentLength(100)
      .withIpAddress("10.0.0.1")
      .withUserAgent("Mozilla/5.0")
      .withOrigin("https://example.com")
      .withReferer("https://example.com/page")
      .withMetadata("env", "test")
      .build();

    expect(ctx.requestId).toBe("req_123");
    expect(ctx.method).toBe("POST");
    expect(ctx.path).toBe("/api/reservations");
    expect(ctx.headers["content-type"]).toBe("application/json");
    expect(ctx.headers["x-custom"]).toBe("value");
    expect(ctx.query).toEqual({ page: "1" });
    expect(ctx.body).toEqual({ name: "test" });
    expect(ctx.contentType).toBe("application/json");
    expect(ctx.contentLength).toBe(100);
    expect(ctx.ipAddress).toBe("10.0.0.1");
    expect(ctx.userAgent).toBe("Mozilla/5.0");
    expect(ctx.origin).toBe("https://example.com");
    expect(ctx.referer).toBe("https://example.com/page");
    expect(ctx.metadata.env).toBe("test");
    expect(ctx.timestamp).toBeInstanceOf(Date);
  });

  it("builds minimal context", () => {
    const ctx = new ProtectionContextBuilder().build();

    expect(ctx.requestId).toBe("");
    expect(ctx.method).toBe("GET");
    expect(ctx.path).toBe("/");
    expect(ctx.headers).toEqual({});
    expect(ctx.query).toEqual({});
    expect(ctx.body).toBeUndefined();
    expect(ctx.metadata).toEqual({});
  });

  it("chains builder methods", () => {
    const ctx = new ProtectionContextBuilder()
      .withRequestId("r1")
      .withMethod("DELETE")
      .withPath("/admin")
      .build();

    expect(ctx.requestId).toBe("r1");
    expect(ctx.method).toBe("DELETE");
    expect(ctx.path).toBe("/admin");
  });

  it("creates from partial with static factory", () => {
    const ctx = ProtectionContextBuilder.from({
      method: "PUT",
      path: "/api/update",
    }).build();

    expect(ctx.method).toBe("PUT");
    expect(ctx.path).toBe("/api/update");
  });

  it("sets security context", () => {
    const securityContext: SecurityContext = {
      userId: "u1",
      organizationId: "org1",
      roles: [],
      permissions: ["read"],
      metadata: {},
    };

    const ctx = new ProtectionContextBuilder()
      .withSecurityContext(securityContext)
      .build();

    expect(ctx.securityContext).toBeDefined();
    expect(ctx.securityContext!.userId).toBe("u1");
    expect(ctx.securityContext!.permissions).toEqual(["read"]);
  });
});

describe("createProtectionContext", () => {
  it("creates context with defaults", () => {
    const ctx = createProtectionContext({});

    expect(ctx.method).toBe("GET");
    expect(ctx.path).toBe("/");
    expect(ctx.requestId).toMatch(/^req_/);
    expect(ctx.metadata.createdAt).toBeDefined();
  });

  it("creates context with overrides", () => {
    const ctx = createProtectionContext({
      method: "POST",
      path: "/api/data",
      contentType: "application/json",
      body: { key: "val" },
    });

    expect(ctx.method).toBe("POST");
    expect(ctx.path).toBe("/api/data");
    expect(ctx.contentType).toBe("application/json");
    expect(ctx.body).toEqual({ key: "val" });
  });

  it("sanitizes missing optional fields to empty strings", () => {
    const ctx = createProtectionContext({});

    expect(ctx.ipAddress).toBe("");
    expect(ctx.userAgent).toBe("");
    expect(ctx.origin).toBe("");
    expect(ctx.contentType).toBe("");
  });
});
