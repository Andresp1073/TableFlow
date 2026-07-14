import { describe, it, expect } from "vitest";
import { CachePolicy } from "../CachePolicy.js";
import type { CachePolicy as CachePolicyInterface } from "../types.js";

describe("CachePolicy", () => {
  describe("factory methods", () => {
    it("absolute creates a policy with absolute type", () => {
      const policy = CachePolicy.absolute(5000);

      expect(policy.type).toBe("absolute");
      expect(policy.ttlMs).toBe(5000);
    });

    it("sliding creates a policy with sliding type", () => {
      const policy = CachePolicy.sliding(10000);

      expect(policy.type).toBe("sliding");
      expect(policy.slidingWindowMs).toBe(10000);
    });

    it("none creates a policy with none type", () => {
      const policy = CachePolicy.none();

      expect(policy.type).toBe("none");
      expect(policy.ttlMs).toBeUndefined();
    });

    it("custom creates a policy with custom type", () => {
      const policy = CachePolicy.custom(30000, 15000);

      expect(policy.type).toBe("custom");
      expect(policy.ttlMs).toBe(30000);
      expect(policy.slidingWindowMs).toBe(15000);
    });

    it("custom without sliding creates a simple custom policy", () => {
      const policy = CachePolicy.custom(60000);

      expect(policy.type).toBe("custom");
      expect(policy.ttlMs).toBe(60000);
      expect(policy.slidingWindowMs).toBeUndefined();
    });

    it("defaultTTL returns 5 minutes absolute", () => {
      const policy = CachePolicy.defaultTTL();

      expect(policy.type).toBe("absolute");
      expect(policy.ttlMs).toBe(300_000);
    });
  });

  describe("from", () => {
    it("fills missing fields with defaults", () => {
      const policy = CachePolicy.from({});

      expect(policy.type).toBe("absolute");
      expect(policy.ttlMs).toBe(300_000);
    });

    it("preserves provided fields", () => {
      const policy = CachePolicy.from({ type: "sliding", slidingWindowMs: 20000 });

      expect(policy.type).toBe("sliding");
      expect(policy.slidingWindowMs).toBe(20000);
      expect(policy.ttlMs).toBe(300_000);
    });
  });

  describe("resolveTTL", () => {
    it("returns ttlMs for absolute policy", () => {
      const policy: CachePolicyInterface = { type: "absolute", ttlMs: 5000 };

      expect(CachePolicy.resolveTTL(policy, 1000)).toBe(5000);
    });

    it("returns slidingWindowMs for sliding policy", () => {
      const policy: CachePolicyInterface = { type: "sliding", slidingWindowMs: 10000 };

      expect(CachePolicy.resolveTTL(policy, 1000)).toBe(10000);
    });

    it("returns ttlMs for custom policy", () => {
      const policy: CachePolicyInterface = { type: "custom", ttlMs: 60000 };

      expect(CachePolicy.resolveTTL(policy, 1000)).toBe(60000);
    });

    it("returns null for none policy", () => {
      const policy: CachePolicyInterface = { type: "none" };

      expect(CachePolicy.resolveTTL(policy, 1000)).toBeNull();
    });

    it("falls back to 300s default when ttlMs is undefined", () => {
      const policy: CachePolicyInterface = { type: "absolute" };

      expect(CachePolicy.resolveTTL(policy, 1000)).toBe(300_000);
    });
  });

  describe("isExpired", () => {
    it("returns true when currentTime >= expiresAt", () => {
      const policy: CachePolicyInterface = { type: "absolute", ttlMs: 100 };

      expect(CachePolicy.isExpired(policy, 500, 0, 500)).toBe(true);
      expect(CachePolicy.isExpired(policy, 500, 0, 600)).toBe(true);
    });

    it("returns false when currentTime < expiresAt", () => {
      const policy: CachePolicyInterface = { type: "absolute", ttlMs: 100 };

      expect(CachePolicy.isExpired(policy, 500, 0, 400)).toBe(false);
    });

    it("returns false when expiresAt is null", () => {
      const policy: CachePolicyInterface = { type: "none" };

      expect(CachePolicy.isExpired(policy, null, 0, 999999)).toBe(false);
    });
  });

  describe("shouldRefreshSliding", () => {
    it("returns true when remaining is less than half the window", () => {
      const now = 10000;
      const policy: CachePolicyInterface = { type: "sliding", slidingWindowMs: 10000 };

      const expiresAt = now + 4000;

      expect(CachePolicy.shouldRefreshSliding(policy, expiresAt, now)).toBe(true);
    });

    it("returns false when remaining is more than half the window", () => {
      const now = 10000;
      const policy: CachePolicyInterface = { type: "sliding", slidingWindowMs: 10000 };

      const expiresAt = now + 6000;

      expect(CachePolicy.shouldRefreshSliding(policy, expiresAt, now)).toBe(false);
    });

    it("returns false for non-sliding policies", () => {
      const policy: CachePolicyInterface = { type: "absolute", ttlMs: 5000 };

      expect(CachePolicy.shouldRefreshSliding(policy, 100, 50)).toBe(false);
    });
  });

  describe("computeExpiresAt", () => {
    it("returns currentTime + ttl for absolute policy", () => {
      const policy: CachePolicyInterface = { type: "absolute", ttlMs: 5000 };

      expect(CachePolicy.computeExpiresAt(policy, 1000)).toBe(6000);
    });

    it("returns null for none policy", () => {
      const policy: CachePolicyInterface = { type: "none" };

      expect(CachePolicy.computeExpiresAt(policy, 1000)).toBeNull();
    });

    it("returns currentTime + slidingWindow for sliding policy", () => {
      const policy: CachePolicyInterface = { type: "sliding", slidingWindowMs: 30000 };

      expect(CachePolicy.computeExpiresAt(policy, 5000)).toBe(35000);
    });
  });
});
