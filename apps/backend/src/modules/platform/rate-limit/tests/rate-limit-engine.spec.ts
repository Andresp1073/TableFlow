import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimitEngine } from "../RateLimitEngine.js";
import { FixedWindowStrategy } from "../strategies/FixedWindowStrategy.js";
import { SlidingWindowStrategy } from "../strategies/SlidingWindowStrategy.js";
import { TokenBucketStrategy } from "../strategies/TokenBucketStrategy.js";
import { LeakyBucketStrategy } from "../strategies/LeakyBucketStrategy.js";
import { RateLimitCounter } from "../RateLimitCounter.js";
import { RateLimitKeyResolver } from "../RateLimitKeyResolver.js";
import { NoopCacheProvider } from "../../cache/NoopCacheProvider.js";
import { createRateLimitContext } from "../RateLimitContext.js";
import { createPolicy } from "../RateLimitPolicy.js";
import type { RateLimitContext, Logger } from "../types.js";

describe("RateLimitEngine", () => {
  let cache: NoopCacheProvider;
  let engine: RateLimitEngine;

  function createEngine(policies?: Parameters<typeof createPolicy>[0][]) {
    const resolvedPolicies = (policies ?? [{ name: "test_policy", maxRequests: 5, windowMs: 60_000 }]).map(createPolicy);

    return new RateLimitEngine({
      strategies: [
        new FixedWindowStrategy(),
        new SlidingWindowStrategy(),
        new TokenBucketStrategy(),
        new LeakyBucketStrategy(),
      ],
      keyResolver: new RateLimitKeyResolver(),
      counter: new RateLimitCounter(cache),
      policies: resolvedPolicies,
    });
  }

  beforeEach(async () => {
    cache = new NoopCacheProvider();
    engine = createEngine();
    await cache.clear();
  });

  describe("evaluate", () => {
    it("allows requests within the policy limit", async () => {
      const context = createRateLimitContext({
        ipAddress: "192.168.1.1",
        policyName: "test_policy",
      });

      for (let i = 0; i < 5; i++) {
        const decision = await engine.evaluate(context);

        expect(decision.allowed).toBe(true);
      }
    });

    it("rejects requests exceeding the policy limit", async () => {
      const context = createRateLimitContext({
        ipAddress: "192.168.1.2",
        policyName: "test_policy",
      });

      for (let i = 0; i < 5; i++) {
        await engine.evaluate(context);
      }

      const decision = await engine.evaluate(context);

      expect(decision.allowed).toBe(false);
      expect(decision.policyName).toBe("test_policy");
    });

    it("returns allowed decision when no policy matches", async () => {
      const context = createRateLimitContext({
        ipAddress: "10.0.0.1",
        policyName: "nonexistent_policy",
      });

      const decision = await engine.evaluate(context);

      expect(decision.allowed).toBe(true);
      expect(decision.policyName).toBe("none");
    });

    it("returns allowed when policy is disabled", async () => {
      const e = createEngine([{ name: "disabled_policy", enabled: false, maxRequests: 0 }]);
      const context = createRateLimitContext({
        ipAddress: "10.0.0.2",
        policyName: "disabled_policy",
      });

      const decision = await e.evaluate(context);

      expect(decision.allowed).toBe(true);
    });

    it("uses different counters per dimension", async () => {
      const alice = createRateLimitContext({ ipAddress: "10.0.0.1", policyName: "test_policy" });
      const bob = createRateLimitContext({ ipAddress: "10.0.0.2", policyName: "test_policy" });

      for (let i = 0; i < 5; i++) {
        await engine.evaluate(alice);
      }

      const aliceRejected = await engine.evaluate(alice);

      expect(aliceRejected.allowed).toBe(false);

      const bobDecision = await engine.evaluate(bob);

      expect(bobDecision.allowed).toBe(true);
      expect(bobDecision.remaining).toBe(4);
    });

    it("returns correct decision metadata", async () => {
      const context = createRateLimitContext({
        ipAddress: "10.0.0.3",
        policyName: "test_policy",
      });

      const decision = await engine.evaluate(context);

      expect(decision.allowed).toBe(true);
      expect(decision.policyName).toBe("test_policy");
      expect(decision.limit).toBe(5);
      expect(decision.remaining).toBe(4);
      expect(decision.retryAfterMs).toBe(0);
      expect(decision.resetTime).toBeInstanceOf(Date);
    });
  });

  describe("registerPolicy", () => {
    it("registers a new policy", async () => {
      const newPolicy = createPolicy({ name: "new_policy", maxRequests: 10 });

      engine.registerPolicy(newPolicy);

      const retrieved = engine.getPolicy("new_policy");

      expect(retrieved).toBeDefined();
      expect(retrieved!.maxRequests).toBe(10);
    });

    it("overwrites an existing policy", async () => {
      const updated = createPolicy({ name: "test_policy", maxRequests: 100 });

      engine.registerPolicy(updated);

      const retrieved = engine.getPolicy("test_policy");

      expect(retrieved!.maxRequests).toBe(100);
    });
  });

  describe("getPolicy", () => {
    it("returns undefined for unknown policy", () => {
      const result = engine.getPolicy("unknown");

      expect(result).toBeUndefined();
    });
  });

  describe("reset", () => {
    it("resets counters for a specific policy", async () => {
      const context = createRateLimitContext({
        ipAddress: "10.0.0.4",
        policyName: "test_policy",
      });

      for (let i = 0; i < 5; i++) {
        await engine.evaluate(context);
      }

      const before = await engine.evaluate(context);

      expect(before.allowed).toBe(false);

      await engine.reset({ ...context, policyName: "test_policy" });

      const after = await engine.evaluate(context);

      expect(after.allowed).toBe(true);
      expect(after.remaining).toBe(4);
    });

    it("resets counters for all policies when no policy name given", async () => {
      const e = createEngine([
        { name: "p1", maxRequests: 2 },
        { name: "p2", maxRequests: 2 },
      ]);
      const ctx1 = createRateLimitContext({ ipAddress: "10.0.0.5", policyName: "p1" });
      const ctx2 = createRateLimitContext({ ipAddress: "10.0.0.5", policyName: "p2" });

      await e.evaluate(ctx1);
      await e.evaluate(ctx1);
      await e.evaluate(ctx2);
      await e.evaluate(ctx2);

      expect((await e.evaluate(ctx1)).allowed).toBe(false);
      expect((await e.evaluate(ctx2)).allowed).toBe(false);

      await e.reset(createRateLimitContext({ ipAddress: "10.0.0.5" }));

      expect((await e.evaluate(ctx1)).allowed).toBe(true);
      expect((await e.evaluate(ctx2)).allowed).toBe(true);
    });
  });

  describe("strategy dispatch", () => {
    it("uses fixed_window strategy by default", async () => {
      const e = createEngine([{ name: "fw", strategy: "fixed_window", maxRequests: 3 }]);

      for (let i = 0; i < 3; i++) {
        await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.6", policyName: "fw" }));
      }

      const decision = await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.6", policyName: "fw" }));

      expect(decision.allowed).toBe(false);
      expect(decision.strategy).toBe("fixed_window");
    });

    it("uses sliding_window strategy", async () => {
      const e = createEngine([{ name: "sw", strategy: "sliding_window", maxRequests: 3 }]);

      for (let i = 0; i < 3; i++) {
        await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.7", policyName: "sw" }));
      }

      const decision = await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.7", policyName: "sw" }));

      expect(decision.allowed).toBe(false);
      expect(decision.strategy).toBe("sliding_window");
    });

    it("uses token_bucket strategy", async () => {
      const e = createEngine([{ name: "tb", strategy: "token_bucket", maxRequests: 2, windowMs: 60_000 }]);

      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.8", policyName: "tb" }));
      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.8", policyName: "tb" }));

      const decision = await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.8", policyName: "tb" }));

      expect(decision.allowed).toBe(false);
      expect(decision.strategy).toBe("token_bucket");
    });

    it("uses leaky_bucket strategy", async () => {
      vi.useFakeTimers();

      const e = createEngine([{ name: "lb", strategy: "leaky_bucket", maxRequests: 2, windowMs: 60_000 }]);

      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.9", policyName: "lb" }));
      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.9", policyName: "lb" }));

      const decision = await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.9", policyName: "lb" }));

      expect(decision.allowed).toBe(false);
      expect(decision.strategy).toBe("leaky_bucket");

      vi.useRealTimers();
    });
  });

  describe("error handling", () => {
    it("allows request when strategy throws", async () => {
      const failingStrategy = {
        type: "fixed_window" as const,
        async check() {
          throw new Error("cache unavailable");
        },
      };

      const e = new RateLimitEngine({
        strategies: [failingStrategy],
        keyResolver: new RateLimitKeyResolver(),
        counter: new RateLimitCounter(cache),
        policies: [createPolicy({ name: "failing", maxRequests: 5 })],
      });

      const decision = await e.evaluate(
        createRateLimitContext({ ipAddress: "10.0.0.10", policyName: "failing" }),
      );

      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(5);
    });

    it("allows request when no strategy registered for policy type", async () => {
      const e = new RateLimitEngine({
        strategies: [],
        keyResolver: new RateLimitKeyResolver(),
        counter: new RateLimitCounter(cache),
        policies: [createPolicy({ name: "no_strategy", maxRequests: 5 })],
      });

      const decision = await e.evaluate(
        createRateLimitContext({ ipAddress: "10.0.0.11", policyName: "no_strategy" }),
      );

      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(5);
    });
  });

  describe("metrics collector", () => {
    it("calls metrics on accepted request", async () => {
      const metrics = {
        incrementAccepted: vi.fn(),
        incrementRejected: vi.fn(),
        incrementPolicyUsage: vi.fn(),
        incrementRetry: vi.fn(),
        setRateLimitRemaining: vi.fn(),
      };

      const e = new RateLimitEngine({
        strategies: [new FixedWindowStrategy()],
        keyResolver: new RateLimitKeyResolver(),
        counter: new RateLimitCounter(cache),
        policies: [createPolicy({ name: "metrics_test", maxRequests: 5 })],
        metrics,
      });

      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.20", policyName: "metrics_test" }));

      expect(metrics.incrementPolicyUsage).toHaveBeenCalledWith("metrics_test");
      expect(metrics.incrementAccepted).toHaveBeenCalledWith("metrics_test");
      expect(metrics.setRateLimitRemaining).toHaveBeenCalledWith("metrics_test", 4);
      expect(metrics.incrementRejected).not.toHaveBeenCalled();
    });

    it("calls metrics on rejected request", async () => {
      const metrics = {
        incrementAccepted: vi.fn(),
        incrementRejected: vi.fn(),
        incrementPolicyUsage: vi.fn(),
        incrementRetry: vi.fn(),
        setRateLimitRemaining: vi.fn(),
      };

      const e = new RateLimitEngine({
        strategies: [new FixedWindowStrategy()],
        keyResolver: new RateLimitKeyResolver(),
        counter: new RateLimitCounter(cache),
        policies: [createPolicy({ name: "metrics_reject", maxRequests: 1 })],
        metrics,
      });

      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.21", policyName: "metrics_reject" }));
      await e.evaluate(createRateLimitContext({ ipAddress: "10.0.0.21", policyName: "metrics_reject" }));

      expect(metrics.incrementRejected).toHaveBeenCalledWith("metrics_reject");
    });
  });
});
