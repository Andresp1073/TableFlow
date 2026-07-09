import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryCacheProvider } from "./MemoryCacheProvider.js";

describe("MemoryCacheProvider", () => {
  let cache: MemoryCacheProvider;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new MemoryCacheProvider({ sweepIntervalMs: 60_000 });
  });

  afterEach(() => {
    cache.dispose();
    vi.useRealTimers();
  });

  describe("get and set", () => {
    it("stores and retrieves a value", async () => {
      await cache.set("key1", "value1");
      const result = await cache.get<string>("key1");
      expect(result).toBe("value1");
    });

    it("returns undefined for missing key", async () => {
      const result = await cache.get<string>("nonexistent");
      expect(result).toBeUndefined();
    });

    it("returns undefined for expired entry", async () => {
      await cache.set("key1", "value1", 100);
      vi.advanceTimersByTime(150);
      const result = await cache.get<string>("key1");
      expect(result).toBeUndefined();
    });

    it("returns value before TTL expiry", async () => {
      await cache.set("key1", "value1", 1000);
      vi.advanceTimersByTime(500);
      const result = await cache.get<string>("key1");
      expect(result).toBe("value1");
    });

    it("overwrites existing key", async () => {
      await cache.set("key1", "value1");
      await cache.set("key1", "value2");
      const result = await cache.get<string>("key1");
      expect(result).toBe("value2");
    });

    it("stores objects and arrays", async () => {
      const obj = { a: 1, b: "hello" };
      await cache.set("obj", obj);
      const result = await cache.get<typeof obj>("obj");
      expect(result).toEqual(obj);
    });

    it("stores null and number values", async () => {
      await cache.set("null", null);
      await cache.set("num", 42);
      expect(await cache.get("null")).toBeNull();
      expect(await cache.get<number>("num")).toBe(42);
    });
  });

  describe("delete", () => {
    it("removes an existing key", async () => {
      await cache.set("key1", "value1");
      const deleted = await cache.delete("key1");
      expect(deleted).toBe(true);
      const result = await cache.get<string>("key1");
      expect(result).toBeUndefined();
    });

    it("returns false for non-existing key", async () => {
      const deleted = await cache.delete("nonexistent");
      expect(deleted).toBe(false);
    });

    it("increments deletion stats", async () => {
      await cache.set("key1", "value1");
      await cache.delete("key1");
      const stats = cache.getStats();
      expect(stats.deletions).toBe(1);
    });
  });

  describe("deleteByPattern", () => {
    it("deletes keys matching wildcard pattern", async () => {
      await cache.set("permissions:user:u1:r1", "data1");
      await cache.set("permissions:user:u1:r2", "data2");
      await cache.set("permissions:user:u2:r1", "data3");
      await cache.set("roles:user:u1:r1", "data4");

      const count = await cache.deleteByPattern("permissions:user:u1:*");
      expect(count).toBe(2);
      expect(await cache.get("permissions:user:u1:r1")).toBeUndefined();
      expect(await cache.get("permissions:user:u1:r2")).toBeUndefined();
      expect(await cache.get("permissions:user:u2:r1")).toBe("data3");
    });

    it("deletes keys with exact pattern", async () => {
      await cache.set("key1", "v1");
      await cache.set("key2", "v2");

      const count = await cache.deleteByPattern("key1");
      expect(count).toBe(1);
      expect(await cache.get("key1")).toBeUndefined();
      expect(await cache.get("key2")).toBe("v2");
    });

    it("returns 0 when no keys match", async () => {
      const count = await cache.deleteByPattern("nonexistent:*");
      expect(count).toBe(0);
    });

    it("handles special regex characters in pattern", async () => {
      await cache.set("test[a]", "v1");
      await cache.set("test.b", "v2");

      const count = await cache.deleteByPattern("test[a]");
      expect(count).toBe(1);
    });
  });

  describe("exists", () => {
    it("returns true for existing key", async () => {
      await cache.set("key1", "value1");
      expect(await cache.exists("key1")).toBe(true);
    });

    it("returns false for non-existing key", async () => {
      expect(await cache.exists("nonexistent")).toBe(false);
    });

    it("returns false for expired key", async () => {
      await cache.set("key1", "value1", 100);
      vi.advanceTimersByTime(150);
      expect(await cache.exists("key1")).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all entries and resets stats", async () => {
      await cache.set("key1", "v1");
      await cache.set("key2", "v2");
      await cache.get("key1");

      await cache.clear();

      expect(cache.getStats().entries).toBe(0);

      expect(await cache.get("key1")).toBeUndefined();
      expect(await cache.get("key2")).toBeUndefined();
    });
  });

  describe("getStats", () => {
    it("tracks hits and misses", async () => {
      await cache.set("key1", "v1");
      await cache.get<string>("key1");
      await cache.get<string>("key1");
      await cache.get<string>("missing");

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it("calculates hit rate", async () => {
      await cache.set("k", "v");
      await cache.get("k");
      await cache.get("k");
      await cache.get("x");

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it("returns 0 hit rate when no operations", () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it("tracks sets and deletions", async () => {
      await cache.set("k1", "v1");
      await cache.set("k2", "v2");
      await cache.delete("k1");

      const stats = cache.getStats();
      expect(stats.sets).toBe(2);
      expect(stats.deletions).toBe(1);
    });

    it("tracks entries count", async () => {
      await cache.set("k1", "v1");
      await cache.set("k2", "v2");
      expect(cache.getStats().entries).toBe(2);

      await cache.delete("k1");
      expect(cache.getStats().entries).toBe(1);
    });

    it("tracks invalidations from deleteByPattern", async () => {
      await cache.set("a:1", "v1");
      await cache.set("a:2", "v2");
      await cache.deleteByPattern("a:*");

      const stats = cache.getStats();
      expect(stats.invalidations).toBe(2);
    });
  });

  describe("eviction", () => {
    it("evicts oldest entry when maxEntries is reached", async () => {
      cache = new MemoryCacheProvider({
        sweepIntervalMs: 60_000,
        maxEntries: 3,
        defaultTtlMs: 0,
      });

      await cache.set("k1", "v1");
      await cache.set("k2", "v2");
      await cache.set("k3", "v3");
      await cache.set("k4", "v4");

      expect(await cache.get("k1")).toBeUndefined();
      expect(await cache.get("k4")).toBe("v4");
    });

    it("evicts expired entries first", async () => {
      cache = new MemoryCacheProvider({
        sweepIntervalMs: 60_000,
        maxEntries: 2,
        defaultTtlMs: 0,
      });

      await cache.set("k1", "v1", 50);
      await cache.set("k2", "v2", 0);
      vi.advanceTimersByTime(60);

      await cache.set("k3", "v3", 0);

      expect(await cache.get("k1")).toBeUndefined();
      expect(await cache.get("k2")).toBe("v2");
    });

    it("does not evict when under maxEntries", async () => {
      cache = new MemoryCacheProvider({
        sweepIntervalMs: 60_000,
        maxEntries: 100,
        defaultTtlMs: 0,
      });

      await cache.set("k1", "v1");
      await cache.set("k2", "v2");

      expect(cache.getStats().entries).toBe(2);
    });
  });

  describe("sweep", () => {
    it("removes expired entries on periodic sweep", async () => {
      cache = new MemoryCacheProvider({ sweepIntervalMs: 1000 });

      await cache.set("k1", "v1", 100);
      await cache.set("k2", "v2", 5000);

      vi.advanceTimersByTime(200);
      expect(await cache.get("k1")).toBeUndefined();
      expect(await cache.get("k2")).toBe("v2");
    });
  });

  describe("concurrent operations", () => {
    it("handles concurrent get/set", async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(cache.set(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);

      const results = await Promise.all(
        Array.from({ length: 100 }, (_, i) => cache.get<string>(`key${i}`))
      );

      for (let i = 0; i < 100; i++) {
        expect(results[i]).toBe(`value${i}`);
      }
    });
  });

  describe("estimatedSize", () => {
    it("returns non-zero for stored data", async () => {
      await cache.set("key1", "hello world");
      const stats = cache.getStats();
      expect(stats.estimatedSize).toBeGreaterThan(0);
    });

    it("returns zero for empty cache", () => {
      const stats = cache.getStats();
      expect(stats.estimatedSize).toBe(0);
    });
  });

  describe("dispose", () => {
    it("clears store and stops sweep timer", async () => {
      await cache.set("key1", "v1");
      cache.dispose();

      expect(await cache.get("key1")).toBeUndefined();
      expect(cache.getStats().entries).toBe(0);
    });
  });
});
