import { describe, it, expect, beforeEach } from "vitest";
import { RateLimitKeyResolver } from "../RateLimitKeyResolver.js";
import { RateLimitCounter } from "../RateLimitCounter.js";
import { NoopCacheProvider } from "../../cache/NoopCacheProvider.js";
import { RateLimitContextBuilder, createRateLimitContext } from "../RateLimitContext.js";
import { createAllowedDecision, createRejectedDecision, createDefaultDecision } from "../RateLimitDecision.js";
import { createPolicy, DEFAULT_POLICIES } from "../RateLimitPolicy.js";
import type { RateLimitPolicyConfig, LimitDimension } from "../types.js";

describe("RateLimitKeyResolver", () => {
  let resolver: RateLimitKeyResolver;

  beforeEach(() => {
    resolver = new RateLimitKeyResolver();
  });

  it("resolves a key from ip dimension", () => {
    const context = createRateLimitContext({ ipAddress: "192.168.1.1" });
    const key = resolver.resolve(context, ["ip"]);

    expect(key).toContain("ratelimit");
    expect(key).toContain("ip:192.168.1.1");
  });

  it("resolves a key from user dimension", () => {
    const context = createRateLimitContext({ userId: "user_123" });
    const key = resolver.resolve(context, ["user"]);

    expect(key).toContain("user:user_123");
  });

  it("resolves a key from multiple dimensions", () => {
    const context = createRateLimitContext({ userId: "user_1", restaurantId: "rest_1" });
    const key = resolver.resolve(context, ["user", "restaurant"]);

    expect(key).toContain("user:user_1");
    expect(key).toContain("restaurant:rest_1");
  });

  it("resolves a key from role dimension", () => {
    const context = createRateLimitContext({ role: "admin" });
    const key = resolver.resolve(context, ["role"]);

    expect(key).toContain("role:admin");
  });

  it("resolves a key from tenant dimension", () => {
    const context = createRateLimitContext({ tenantId: "tenant_abc" });
    const key = resolver.resolve(context, ["tenant"]);

    expect(key).toContain("tenant:tenant_abc");
  });

  it("resolves a key from api_key dimension", () => {
    const context = createRateLimitContext({ apiKey: "sk_live_xxx" });
    const key = resolver.resolve(context, ["api_key"]);

    expect(key).toContain("api_key:sk_live_xxx");
  });

  it("resolves a key from endpoint dimension with method", () => {
    const context = createRateLimitContext({ endpoint: "/api/reservations", method: "POST" });
    const key = resolver.resolve(context, ["endpoint"]);

    expect(key).toContain("POST:/api/reservations");
  });

  it("returns global key when no dimensions match", () => {
    const context = createRateLimitContext({});
    const key = resolver.resolve(context, []);

    expect(key).toBe("ratelimit:global");
  });

  it("skips empty dimension values", () => {
    const context = createRateLimitContext({ userId: "", role: "" });
    const key = resolver.resolve(context, ["user", "role"]);

    expect(key).toBe("ratelimit:global");
  });

  describe("resolveWithPolicy", () => {
    it("includes policy name in key", () => {
      const context = createRateLimitContext({ ipAddress: "10.0.0.1" });
      const key = resolver.resolveWithPolicy(context, "login_policy", ["ip"]);

      expect(key).toContain("policy:login_policy");
      expect(key).toContain("ip:10.0.0.1");
    });
  });
});

describe("RateLimitCounter", () => {
  let cache: NoopCacheProvider;
  let counter: RateLimitCounter;

  beforeEach(async () => {
    cache = new NoopCacheProvider();
    counter = new RateLimitCounter(cache);
    await cache.clear();
  });

  it("increments a counter", async () => {
    const value = await counter.increment("test_key", 60_000);

    expect(value).toBe(1);

    const value2 = await counter.increment("test_key", 60_000);

    expect(value2).toBe(2);
  });

  it("returns current count", async () => {
    await counter.increment("get_test", 60_000);

    const count = await counter.get("get_test");

    expect(count).toBe(1);
  });

  it("returns 0 for missing key", async () => {
    const count = await counter.get("missing");

    expect(count).toBe(0);
  });

  it("resets all counter types", async () => {
    await counter.increment("reset_key", 60_000);

    await counter.reset("reset_key");

    const count = await counter.get("reset_key");

    expect(count).toBe(0);
  });

  it("manages window data", async () => {
    const now = Date.now();
    const data = { count: 5, windowStart: now, expiresAt: now + 60_000 };

    await counter.setWindow("win_key", data, 60_000);

    const retrieved = await counter.getWindow("win_key");

    expect(retrieved).not.toBeNull();
    expect(retrieved!.count).toBe(5);
  });

  it("manages token bucket data", async () => {
    const data = { tokens: 10, lastRefill: Date.now(), capacity: 10, refillRate: 1 };

    await counter.setTokenBucket("tb_key", data, 60_000);

    const retrieved = await counter.getTokenBucket("tb_key");

    expect(retrieved).not.toBeNull();
    expect(retrieved!.tokens).toBe(10);
    expect(retrieved!.capacity).toBe(10);
  });

  it("manages leaky bucket data", async () => {
    const data = { water: 3, lastLeak: Date.now(), capacity: 10, leakRate: 0.5 };

    await counter.setLeakyBucket("lb_key", data, 60_000);

    const retrieved = await counter.getLeakyBucket("lb_key");

    expect(retrieved).not.toBeNull();
    expect(retrieved!.water).toBe(3);
    expect(retrieved!.capacity).toBe(10);
  });

  it("returns null for missing window data", async () => {
    const retrieved = await counter.getWindow("no_such_key");

    expect(retrieved).toBeNull();
  });

  it("returns null for missing token bucket data", async () => {
    const retrieved = await counter.getTokenBucket("no_such_key");

    expect(retrieved).toBeNull();
  });

  it("returns null for missing leaky bucket data", async () => {
    const retrieved = await counter.getLeakyBucket("no_such_key");

    expect(retrieved).toBeNull();
  });
});

describe("RateLimitContextBuilder", () => {
  it("builds context with all fields", () => {
    const context = new RateLimitContextBuilder()
      .withUserId("user_1")
      .withRole("admin")
      .withRestaurantId("rest_1")
      .withTenantId("tenant_1")
      .withApiKey("key_1")
      .withIpAddress("10.0.0.1")
      .withEndpoint("/api/test", "GET")
      .withPolicyName("test_policy")
      .withMetadata("custom", "value")
      .build();

    expect(context.userId).toBe("user_1");
    expect(context.role).toBe("admin");
    expect(context.restaurantId).toBe("rest_1");
    expect(context.tenantId).toBe("tenant_1");
    expect(context.apiKey).toBe("key_1");
    expect(context.ipAddress).toBe("10.0.0.1");
    expect(context.endpoint).toBe("/api/test");
    expect(context.method).toBe("GET");
    expect(context.policyName).toBe("test_policy");
    expect(context.metadata.custom).toBe("value");
  });

  it("builds empty context", () => {
    const context = new RateLimitContextBuilder().build();

    expect(context.metadata).toEqual({});
  });

  it("creates context from partial with static factory", () => {
    const context = RateLimitContextBuilder.from({
      userId: "user_2",
      role: "manager",
    }).build();

    expect(context.userId).toBe("user_2");
    expect(context.role).toBe("manager");
  });

  it("chains builder methods", () => {
    const context = new RateLimitContextBuilder()
      .withUserId("a")
      .withRole("b")
      .withIpAddress("c")
      .build();

    expect(context.userId).toBe("a");
    expect(context.role).toBe("b");
    expect(context.ipAddress).toBe("c");
  });
});

describe("createRateLimitContext", () => {
  it("creates context with all options", () => {
    const context = createRateLimitContext({
      userId: "u1",
      role: "r1",
      restaurantId: "rest1",
      tenantId: "t1",
      apiKey: "ak1",
      ipAddress: "10.0.0.1",
      endpoint: "/api",
      method: "POST",
      policyName: "p1",
    });

    expect(context.userId).toBe("u1");
    expect(context.role).toBe("r1");
    expect(context.restaurantId).toBe("rest1");
    expect(context.tenantId).toBe("t1");
    expect(context.apiKey).toBe("ak1");
    expect(context.ipAddress).toBe("10.0.0.1");
    expect(context.endpoint).toBe("/api");
    expect(context.policyName).toBe("p1");
  });

  it("includes createdAt in metadata", () => {
    const context = createRateLimitContext({});

    expect(context.metadata.createdAt).toBeDefined();
  });
});

describe("RateLimitDecision", () => {
  describe("createAllowedDecision", () => {
    it("creates an allowed decision", () => {
      const resetTime = new Date(Date.now() + 60_000);
      const decision = createAllowedDecision(4, 5, resetTime, "test", "fixed_window");

      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(4);
      expect(decision.limit).toBe(5);
      expect(decision.resetTime).toBe(resetTime);
      expect(decision.retryAfterMs).toBe(0);
      expect(decision.policyName).toBe("test");
      expect(decision.strategy).toBe("fixed_window");
    });
  });

  describe("createRejectedDecision", () => {
    it("creates a rejected decision", () => {
      const resetTime = new Date(Date.now() + 30_000);
      const decision = createRejectedDecision(0, 5, 30_000, resetTime, "test", "sliding_window");

      expect(decision.allowed).toBe(false);
      expect(decision.remaining).toBe(0);
      expect(decision.limit).toBe(5);
      expect(decision.retryAfterMs).toBe(30_000);
      expect(decision.resetTime).toBe(resetTime);
      expect(decision.policyName).toBe("test");
      expect(decision.strategy).toBe("sliding_window");
    });
  });

  describe("createDefaultDecision", () => {
    it("creates a default allowed decision from policy", () => {
      const policy: RateLimitPolicyConfig = {
        name: "default_test",
        strategy: "token_bucket",
        maxRequests: 10,
        windowMs: 60_000,
        dimensions: ["ip"],
        enabled: true,
      };

      const decision = createDefaultDecision(policy, "token_bucket");

      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(10);
      expect(decision.limit).toBe(10);
      expect(decision.policyName).toBe("default_test");
      expect(decision.strategy).toBe("token_bucket");
      expect(decision.retryAfterMs).toBe(0);
    });
  });
});

describe("createPolicy", () => {
  it("creates a policy with defaults", () => {
    const policy = createPolicy({ name: "my_policy" });

    expect(policy.name).toBe("my_policy");
    expect(policy.strategy).toBe("fixed_window");
    expect(policy.maxRequests).toBe(100);
    expect(policy.windowMs).toBe(60_000);
    expect(policy.dimensions).toEqual(["ip"]);
    expect(policy.enabled).toBe(true);
  });

  it("creates a policy with overrides", () => {
    const policy = createPolicy({
      name: "custom",
      strategy: "token_bucket",
      maxRequests: 50,
      windowMs: 120_000,
      dimensions: ["user", "restaurant"],
      burstMultiplier: 2,
    });

    expect(policy.name).toBe("custom");
    expect(policy.strategy).toBe("token_bucket");
    expect(policy.maxRequests).toBe(50);
    expect(policy.windowMs).toBe(120_000);
    expect(policy.dimensions).toEqual(["user", "restaurant"]);
    expect(policy.burstMultiplier).toBe(2);
  });

  it("can disable a policy", () => {
    const policy = createPolicy({ name: "disabled", enabled: false });

    expect(policy.enabled).toBe(false);
  });
});

describe("DEFAULT_POLICIES", () => {
  it("defines login policy", () => {
    const p = DEFAULT_POLICIES.login;

    expect(p.name).toBe("login");
    expect(p.strategy).toBe("sliding_window");
    expect(p.maxRequests).toBe(5);
  });

  it("defines reservation_api policy", () => {
    const p = DEFAULT_POLICIES.reservation_api;

    expect(p.name).toBe("reservation_api");
    expect(p.strategy).toBe("sliding_window");
    expect(p.maxRequests).toBe(60);
    expect(p.burstMultiplier).toBe(1.5);
  });

  it("defines public_booking_api policy", () => {
    const p = DEFAULT_POLICIES.public_booking_api;

    expect(p.name).toBe("public_booking_api");
    expect(p.strategy).toBe("token_bucket");
    expect(p.maxRequests).toBe(30);
  });

  it("defines admin_api policy", () => {
    const p = DEFAULT_POLICIES.admin_api;

    expect(p.name).toBe("admin_api");
    expect(p.strategy).toBe("fixed_window");
    expect(p.maxRequests).toBe(200);
  });

  it("defines webhook_api policy", () => {
    const p = DEFAULT_POLICIES.webhook_api;

    expect(p.name).toBe("webhook_api");
    expect(p.strategy).toBe("leaky_bucket");
    expect(p.maxRequests).toBe(100);
  });
});
