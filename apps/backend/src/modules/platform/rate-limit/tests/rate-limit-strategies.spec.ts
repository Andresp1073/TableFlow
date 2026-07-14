import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FixedWindowStrategy } from "../strategies/FixedWindowStrategy.js";
import { SlidingWindowStrategy } from "../strategies/SlidingWindowStrategy.js";
import { TokenBucketStrategy } from "../strategies/TokenBucketStrategy.js";
import { LeakyBucketStrategy } from "../strategies/LeakyBucketStrategy.js";
import type { RateLimitCounter, RateLimitPolicyConfig, RateLimitWindowData, TokenBucketData, LeakyBucketData } from "../types.js";

function createMockCounter(): RateLimitCounter {
  const store = new Map<string, unknown>();

  return {
    async increment(key: string, ttlMs: number): Promise<number> {
      const current = (store.get(key) as number) ?? 0;

      store.set(key, current + 1);

      return current + 1;
    },
    async get(key: string): Promise<number> {
      return (store.get(key) as number) ?? 0;
    },
    async reset(key: string): Promise<void> {
      store.delete(`${key}:counter`);
      store.delete(`${key}:window`);
      store.delete(`${key}:token`);
      store.delete(`${key}:leaky`);
    },
    async getWindow(key: string): Promise<RateLimitWindowData | null> {
      return (store.get(key) as RateLimitWindowData) ?? null;
    },
    async setWindow(key: string, data: RateLimitWindowData): Promise<void> {
      store.set(key, data);
    },
    async getTokenBucket(key: string): Promise<TokenBucketData | null> {
      return (store.get(key) as TokenBucketData) ?? null;
    },
    async setTokenBucket(key: string, data: TokenBucketData): Promise<void> {
      store.set(key, data);
    },
    async getLeakyBucket(key: string): Promise<LeakyBucketData | null> {
      return (store.get(key) as LeakyBucketData) ?? null;
    },
    async setLeakyBucket(key: string, data: LeakyBucketData): Promise<void> {
      store.set(key, data);
    },
  };
}

function policy(overrides: Partial<RateLimitPolicyConfig> & { name: string }): RateLimitPolicyConfig {
  return {
    name: overrides.name,
    strategy: overrides.strategy ?? "fixed_window",
    maxRequests: overrides.maxRequests ?? 10,
    windowMs: overrides.windowMs ?? 60_000,
    dimensions: overrides.dimensions ?? ["ip"],
    enabled: overrides.enabled ?? true,
    burstMultiplier: overrides.burstMultiplier,
  };
}

describe("FixedWindowStrategy", () => {
  let strategy: FixedWindowStrategy;
  let counter: RateLimitCounter;

  beforeEach(() => {
    vi.useFakeTimers();
    strategy = new FixedWindowStrategy();
    counter = createMockCounter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within the limit", async () => {
    const p = policy({ name: "test", maxRequests: 5 });

    for (let i = 0; i < 5; i++) {
      const decision = await strategy.check("key1", counter, p);

      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(5 - (i + 1));
    }
  });

  it("rejects requests exceeding the limit", async () => {
    const p = policy({ name: "test", maxRequests: 3 });

    for (let i = 0; i < 3; i++) {
      const decision = await strategy.check("key2", counter, p);

      expect(decision.allowed).toBe(true);
    }

    const decision = await strategy.check("key2", counter, p);

    expect(decision.allowed).toBe(false);
    expect(decision.remaining).toBe(0);
    expect(decision.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks remaining correctly", async () => {
    const p = policy({ name: "test", maxRequests: 5 });
    const decision1 = await strategy.check("key3", counter, p);

    expect(decision1.remaining).toBe(4);

    const decision2 = await strategy.check("key3", counter, p);

    expect(decision2.remaining).toBe(3);
  });

  it("uses separate windows per key", async () => {
    const p = policy({ name: "test", maxRequests: 2 });

    const d1 = await strategy.check("alice", counter, p);
    const d2 = await strategy.check("alice", counter, p);

    expect(d1.allowed).toBe(true);
    expect(d2.allowed).toBe(true);

    const d3 = await strategy.check("bob", counter, p);

    expect(d3.allowed).toBe(true);
    expect(d3.remaining).toBe(1);
  });

  it("returns correct decision metadata", async () => {
    const p = policy({ name: "login_policy", maxRequests: 5 });
    const decision = await strategy.check("meta_test", counter, p);

    expect(decision.allowed).toBe(true);
    expect(decision.policyName).toBe("login_policy");
    expect(decision.strategy).toBe("fixed_window");
    expect(decision.limit).toBe(5);
    expect(decision.resetTime).toBeInstanceOf(Date);
  });

  it("resets window after expiry", async () => {
    const p = policy({ name: "test", maxRequests: 2, windowMs: 50 });

    await strategy.check("exp", counter, p);
    await strategy.check("exp", counter, p);

    const rejected = await strategy.check("exp", counter, p);

    expect(rejected.allowed).toBe(false);

    await vi.advanceTimersByTimeAsync(100);

    const allowed = await strategy.check("exp", counter, p);

    expect(allowed.allowed).toBe(true);
  });
});

describe("SlidingWindowStrategy", () => {
  let strategy: SlidingWindowStrategy;
  let counter: RateLimitCounter;

  beforeEach(() => {
    strategy = new SlidingWindowStrategy();
    counter = createMockCounter();
  });

  it("allows requests within the limit", async () => {
    const p = policy({ name: "test", maxRequests: 5 });

    for (let i = 0; i < 5; i++) {
      const decision = await strategy.check("k1", counter, p);

      expect(decision.allowed).toBe(true);
    }
  });

  it("rejects when estimated count exceeds burst limit", async () => {
    const p = policy({ name: "test", maxRequests: 3, burstMultiplier: 1 });

    for (let i = 0; i < 3; i++) {
      await strategy.check("k2", counter, p);
    }

    const decision = await strategy.check("k2", counter, p);

    expect(decision.allowed).toBe(false);
  });

  it("applies burst multiplier", async () => {
    const p = policy({ name: "test", maxRequests: 3, burstMultiplier: 2 });

    for (let i = 0; i < 6; i++) {
      const decision = await strategy.check("k3", counter, p);

      expect(decision.allowed).toBe(true);
    }

    const decision = await strategy.check("k3", counter, p);

    expect(decision.allowed).toBe(false);
  });

  it("returns correct decision metadata", async () => {
    const p = policy({ name: "burst_api", maxRequests: 10 });
    const decision = await strategy.check("k4", counter, p);

    expect(decision.allowed).toBe(true);
    expect(decision.policyName).toBe("burst_api");
    expect(decision.strategy).toBe("sliding_window");
    expect(decision.limit).toBe(10);
  });
});

describe("TokenBucketStrategy", () => {
  let strategy: TokenBucketStrategy;
  let counter: RateLimitCounter;

  beforeEach(() => {
    strategy = new TokenBucketStrategy();
    counter = createMockCounter();
  });

  it("allows requests up to capacity", async () => {
    const p = policy({ name: "test", maxRequests: 5, windowMs: 60_000 });

    for (let i = 0; i < 5; i++) {
      const decision = await strategy.check("t1", counter, p);

      expect(decision.allowed).toBe(true);
    }
  });

  it("rejects when tokens are exhausted", async () => {
    const p = policy({ name: "test", maxRequests: 3, windowMs: 60_000 });

    for (let i = 0; i < 3; i++) {
      await strategy.check("t2", counter, p);
    }

    const decision = await strategy.check("t2", counter, p);

    expect(decision.allowed).toBe(false);
  });

  it("refills tokens over time", async () => {
    const p = policy({ name: "test", maxRequests: 2, windowMs: 2_000 });

    await strategy.check("t3", counter, p);
    await strategy.check("t3", counter, p);

    const rejected = await strategy.check("t3", counter, p);

    expect(rejected.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 1100));

    const allowed = await strategy.check("t3", counter, p);

    expect(allowed.allowed).toBe(true);
  }, 10_000);

  it("returns correct decision metadata", async () => {
    const p = policy({ name: "token_api", maxRequests: 10, windowMs: 60_000 });
    const decision = await strategy.check("t4", counter, p);

    expect(decision.allowed).toBe(true);
    expect(decision.policyName).toBe("token_api");
    expect(decision.strategy).toBe("token_bucket");
    expect(decision.limit).toBe(10);
  });
});

describe("LeakyBucketStrategy", () => {
  let strategy: LeakyBucketStrategy;
  let counter: RateLimitCounter;

  beforeEach(() => {
    strategy = new LeakyBucketStrategy();
    counter = createMockCounter();
  });

  it("allows requests up to capacity", async () => {
    const p = policy({ name: "test", maxRequests: 5, windowMs: 60_000 });

    for (let i = 0; i < 5; i++) {
      const decision = await strategy.check("l1", counter, p);

      expect(decision.allowed).toBe(true);
    }
  });

  it("rejects when bucket is full", async () => {
    const p = policy({ name: "test", maxRequests: 2, windowMs: 60_000 });

    await strategy.check("l2", counter, p);
    await strategy.check("l2", counter, p);

    const decision = await strategy.check("l2", counter, p);

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterMs).toBeGreaterThan(0);
  });

  it("leaks over time allowing new requests", async () => {
    const p = policy({ name: "test", maxRequests: 2, windowMs: 2_000 });

    await strategy.check("l3", counter, p);
    await strategy.check("l3", counter, p);

    const rejected = await strategy.check("l3", counter, p);

    expect(rejected.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 1100));

    const allowed = await strategy.check("l3", counter, p);

    expect(allowed.allowed).toBe(true);
  }, 10_000);

  it("returns correct decision metadata", async () => {
    const p = policy({ name: "leaky_api", maxRequests: 10, windowMs: 60_000 });
    const decision = await strategy.check("l4", counter, p);

    expect(decision.allowed).toBe(true);
    expect(decision.policyName).toBe("leaky_api");
    expect(decision.strategy).toBe("leaky_bucket");
    expect(decision.limit).toBe(10);
  });
});

describe("RateLimitStrategy - type property", () => {
  it("FixedWindowStrategy has correct type", () => {
    expect(new FixedWindowStrategy().type).toBe("fixed_window");
  });

  it("SlidingWindowStrategy has correct type", () => {
    expect(new SlidingWindowStrategy().type).toBe("sliding_window");
  });

  it("TokenBucketStrategy has correct type", () => {
    expect(new TokenBucketStrategy().type).toBe("token_bucket");
  });

  it("LeakyBucketStrategy has correct type", () => {
    expect(new LeakyBucketStrategy().type).toBe("leaky_bucket");
  });
});
