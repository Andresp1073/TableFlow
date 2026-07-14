import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecretCache } from "../SecretCache.js";
import { NoopCacheProvider } from "../../cache/NoopCacheProvider.js";
import { SecretType } from "../types.js";
import type { Secret } from "../types.js";

describe("SecretCache", () => {
  let provider: NoopCacheProvider;
  let cache: SecretCache;

  function createTestSecret(): Secret {
    return {
      metadata: {
        id: "test_1",
        key: "api_key",
        type: SecretType.ApiKey,
        name: "Test Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "sk-test" },
            createdAt: new Date(),
            status: "active",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      current: { key: "sk-test" },
    };
  }

  beforeEach(async () => {
    provider = new NoopCacheProvider();
    cache = new SecretCache(provider, { ttlMs: 60000, enabled: true });
    await provider.clear();
  });

  it("stores and retrieves secrets", async () => {
    const secret = createTestSecret();

    await cache.set(secret);
    const retrieved = await cache.get("api_key");

    expect(retrieved).not.toBeNull();
    expect(retrieved!.metadata.key).toBe("api_key");
    expect((retrieved!.current as { key: string }).key).toBe("sk-test");
  });

  it("returns null for missing key", async () => {
    const result = await cache.get("nonexistent");

    expect(result).toBeNull();
  });

  it("invalidates a single key", async () => {
    const secret = createTestSecret();

    await cache.set(secret);
    await cache.invalidate("api_key");

    const result = await cache.get("api_key");

    expect(result).toBeNull();
  });

  it("invalidates all secret keys", async () => {
    await cache.set(createTestSecret());
    await cache.set({
      ...createTestSecret(),
      metadata: { ...createTestSecret().metadata, key: "api_key2" },
    });

    await cache.invalidateAll();

    expect(await cache.get("api_key")).toBeNull();
    expect(await cache.get("api_key2")).toBeNull();
  });

  it("does not cache when disabled", async () => {
    const disabledCache = new SecretCache(provider, { ttlMs: 60000, enabled: false });
    const secret = createTestSecret();

    await disabledCache.set(secret);
    const result = await disabledCache.get("api_key");

    expect(result).toBeNull();
  });

  it("getOrFetch returns cached value when available", async () => {
    const secret = createTestSecret();
    const fetchFn = vi.fn().mockResolvedValue(secret);

    await cache.set(secret);

    const result = await cache.getOrFetch("api_key", fetchFn);

    expect(result).not.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("getOrFetch calls fetchFn when not cached", async () => {
    const secret = createTestSecret();
    const fetchFn = vi.fn().mockResolvedValue(secret);

    const result = await cache.getOrFetch("api_key", fetchFn);

    expect(result).not.toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);

    const cached = await cache.get("api_key");

    expect(cached).not.toBeNull();
  });

  it("getOrFetch returns null when fetchFn returns null", async () => {
    const fetchFn = vi.fn().mockResolvedValue(null);

    const result = await cache.getOrFetch("missing_key", fetchFn);

    expect(result).toBeNull();
  });

  it("returns config", () => {
    const config = cache.getConfig();

    expect(config.ttlMs).toBe(60000);
    expect(config.enabled).toBe(true);
  });

  it("isEnabled returns correct state", () => {
    expect(cache.isEnabled()).toBe(true);

    const disabledCache = new SecretCache(provider, { ttlMs: 60000, enabled: false });

    expect(disabledCache.isEnabled()).toBe(false);
  });
});
