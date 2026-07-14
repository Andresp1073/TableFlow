import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheManager } from "../CacheManager.js";
import { NoopCacheProvider } from "../NoopCacheProvider.js";
import { CachePolicy } from "../CachePolicy.js";

describe("CacheManager", () => {
  let provider: NoopCacheProvider;
  let manager: CacheManager;

  beforeEach(async () => {
    provider = new NoopCacheProvider();
    manager = new CacheManager(provider);
    await provider.clear();
  });

  describe("get and set", () => {
    it("stores and retrieves a value", async () => {
      await manager.set("key1", "value1");

      const result = await manager.get<string>("key1");

      expect(result).toBe("value1");
    });

    it("returns null for missing key", async () => {
      const result = await manager.get<string>("nonexistent");

      expect(result).toBeNull();
    });

    it("stores with custom policy", async () => {
      await manager.set("key2", 42, CachePolicy.absolute(10000));

      const result = await manager.get<number>("key2");

      expect(result).toBe(42);
    });

    it("stores objects", async () => {
      const obj = { id: "1", name: "test" };

      await manager.set("obj", obj);

      const result = await manager.get<typeof obj>("obj");

      expect(result).toEqual(obj);
    });

    it("stores null values", async () => {
      await manager.set("null_key", null);

      const result = await manager.get<null>("null_key");

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes an existing key", async () => {
      await manager.set("del_key", "value");

      const deleted = await manager.delete("del_key");

      expect(deleted).toBe(true);

      const result = await manager.get<string>("del_key");

      expect(result).toBeNull();
    });

    it("returns false for nonexistent key", async () => {
      const deleted = await manager.delete("nonexistent");

      expect(deleted).toBe(false);
    });
  });

  describe("exists", () => {
    it("returns true for existing key", async () => {
      await manager.set("exist_key", "value");

      expect(await manager.exists("exist_key")).toBe(true);
    });

    it("returns false for nonexistent key", async () => {
      expect(await manager.exists("nonexistent")).toBe(false);
    });
  });

  describe("expire", () => {
    it("sets expiration on existing key", async () => {
      await manager.set("exp_key", "value");

      const result = await manager.expire("exp_key", 1);

      expect(result).toBe(true);
    });

    it("returns false for nonexistent key", async () => {
      const result = await manager.expire("nonexistent", 1000);

      expect(result).toBe(false);
    });
  });

  describe("clearByPrefix", () => {
    it("clears all keys with matching prefix", async () => {
      await manager.set("user:1", "a");
      await manager.set("user:2", "b");
      await manager.set("rest:1", "c");

      const count = await manager.clearByPrefix("user:");

      expect(count).toBe(2);
      expect(await manager.get("user:1")).toBeNull();
      expect(await manager.get("user:2")).toBeNull();
      expect(await manager.get("rest:1")).toBe("c");
    });
  });

  describe("getOrSet", () => {
    it("returns cached value when it exists", async () => {
      await manager.set("cache_me", "cached");
      const factory = vi.fn().mockReturnValue("new");

      const result = await manager.getOrSet("cache_me", factory);

      expect(result).toBe("cached");
      expect(factory).not.toHaveBeenCalled();
    });

    it("computes and caches when value does not exist", async () => {
      const factory = vi.fn().mockReturnValue("computed");

      const result = await manager.getOrSet("compute_me", factory);

      expect(result).toBe("computed");
      expect(factory).toHaveBeenCalledTimes(1);

      const cached = await manager.get<string>("compute_me");

      expect(cached).toBe("computed");
    });

    it("works with async factory", async () => {
      const factory = vi.fn().mockResolvedValue("async_value");

      const result = await manager.getOrSet("async_key", factory);

      expect(result).toBe("async_value");
    });

    it("caches with a custom policy", async () => {
      const factory = vi.fn().mockReturnValue("policy_value");
      const policy = CachePolicy.absolute(60000);

      const result = await manager.getOrSet("policy_key", factory, policy);

      expect(result).toBe("policy_value");
      expect(await manager.get<string>("policy_key")).toBe("policy_value");
    });
  });

  describe("batch operations", () => {
    it("mget returns multiple values", async () => {
      await manager.set("a", 1);
      await manager.set("b", 2);
      await manager.set("c", 3);

      const map = await manager.mget<number>(["a", "b", "c", "missing"]);

      expect(map.get("a")).toBe(1);
      expect(map.get("b")).toBe(2);
      expect(map.get("c")).toBe(3);
      expect(map.get("missing")).toBeNull();
    });

    it("mset stores multiple values", async () => {
      await manager.mset([
        { key: "x", value: 10 },
        { key: "y", value: 20 },
      ]);

      expect(await manager.get<number>("x")).toBe(10);
      expect(await manager.get<number>("y")).toBe(20);
    });

    it("mdelete deletes multiple keys", async () => {
      await manager.set("d1", "a");
      await manager.set("d2", "b");
      await manager.set("d3", "c");

      const count = await manager.mdelete(["d1", "d2", "missing"]);

      expect(count).toBe(2);
      expect(await manager.get("d1")).toBeNull();
      expect(await manager.get("d2")).toBeNull();
      expect(await manager.get("d3")).toBe("c");
    });
  });

  describe("clear", () => {
    it("clears all keys", async () => {
      await manager.set("a", 1);
      await manager.set("b", 2);
      await manager.clear();

      expect(await manager.get("a")).toBeNull();
      expect(await manager.get("b")).toBeNull();
    });
  });

  describe("scoped manager with prefix", () => {
    it("prefixes all keys", async () => {
      const scoped = new CacheManager(provider, { prefix: "session" });

      await scoped.set("abc", "data");

      expect(await provider.get("session:abc")).toBe("data");
      expect(await scoped.get<string>("abc")).toBe("data");
    });

    it("child creates nested prefix", async () => {
      const scoped = new CacheManager(provider, { prefix: "app" });
      const child = scoped.child("cache");

      await child.set("key", "val");

      expect(await provider.get("app:cache:key")).toBe("val");
      expect(await child.get<string>("key")).toBe("val");
    });

    it("clear scoped only clears prefix", async () => {
      await provider.set("global:1", "g1");
      const scoped = new CacheManager(provider, { prefix: "scoped" });

      await scoped.set("a", "s1");
      await scoped.clear();

      expect(await provider.get("scoped:a")).toBeNull();
      expect(await provider.get("global:1")).toBe("g1");
    });
  });
});
