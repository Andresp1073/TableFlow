import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeatureFlagCache } from "../FeatureFlagCache.js";
import { NoopCacheProvider } from "../../cache/NoopCacheProvider.js";
import type { FeatureFlag, FeatureFlagDecision } from "../types.js";

describe("FeatureFlagCache", () => {
  let provider: NoopCacheProvider;
  let cache: FeatureFlagCache;

  function createTestFlag(): FeatureFlag {
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
    };
  }

  function createTestDecision(): FeatureFlagDecision {
    return {
      key: "test-flag",
      enabled: true,
      value: true,
      reason: "Test reason",
      evaluatedAt: new Date(),
      context: {},
    };
  }

  beforeEach(async () => {
    provider = new NoopCacheProvider();
    cache = new FeatureFlagCache(provider, { ttlMs: 60000, enabled: true });
    await provider.clear();
  });

  describe("flag cache", () => {
    it("stores and retrieves flags", async () => {
      const flag = createTestFlag();

      await cache.setFlag(flag);
      const retrieved = await cache.getFlag("test-flag");

      expect(retrieved).not.toBeNull();
      expect(retrieved!.key).toBe("test-flag");
      expect(retrieved!.rules).toHaveLength(1);
    });

    it("returns null for missing flag", async () => {
      const result = await cache.getFlag("nonexistent");

      expect(result).toBeNull();
    });

    it("invalidates a single flag", async () => {
      await cache.setFlag(createTestFlag());
      await cache.invalidateFlag("test-flag");

      const result = await cache.getFlag("test-flag");

      expect(result).toBeNull();
    });

    it("invalidates all cache entries", async () => {
      await cache.setFlag(createTestFlag());

      await cache.invalidateAll();

      expect(await cache.getFlag("test-flag")).toBeNull();
    });
  });

  describe("decision cache", () => {
    it("stores and retrieves decisions with context hash", async () => {
      const decision = createTestDecision();
      const hash = "user-1|admin";

      await cache.setDecision(decision, hash);
      const retrieved = await cache.getDecision("test-flag", hash);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.enabled).toBe(true);
      expect(retrieved!.reason).toBe("Test reason");
    });

    it("returns null for mismatched context hash", async () => {
      const decision = createTestDecision();

      await cache.setDecision(decision, "hash-a");
      const result = await cache.getDecision("test-flag", "hash-b");

      expect(result).toBeNull();
    });
  });

  describe("disabled cache", () => {
    it("does not cache when disabled", async () => {
      const disabledCache = new FeatureFlagCache(provider, { ttlMs: 60000, enabled: false });
      const flag = createTestFlag();

      await disabledCache.setFlag(flag);
      const result = await disabledCache.getFlag("test-flag");

      expect(result).toBeNull();
    });

    it("reports disabled state correctly", () => {
      const disabledCache = new FeatureFlagCache(provider, { ttlMs: 60000, enabled: false });

      expect(disabledCache.isEnabled()).toBe(false);
      expect(cache.isEnabled()).toBe(true);
    });
  });

  describe("config", () => {
    it("returns cache configuration", () => {
      const config = cache.getConfig();

      expect(config.ttlMs).toBe(60000);
      expect(config.enabled).toBe(true);
    });

    it("uses default TTL when not specified", () => {
      const defaultCache = new FeatureFlagCache(provider);

      expect(defaultCache.getConfig().ttlMs).toBe(60000);
      expect(defaultCache.getConfig().enabled).toBe(true);
    });
  });
});
