import { describe, it, expect, beforeEach } from "vitest";
import { ConfigurationCache } from "../ConfigurationCache.js";
import { NoopCacheProvider } from "../../cache/NoopCacheProvider.js";

describe("ConfigurationCache", () => {
  let cache: NoopCacheProvider;
  let configCache: ConfigurationCache;

  beforeEach(async () => {
    cache = new NoopCacheProvider();
    configCache = new ConfigurationCache(cache);
    await cache.clear();
  });

  it("stores and retrieves a value", async () => {
    await configCache.set("app.port", 3000);

    const value = await configCache.get("app.port");

    expect(value).toBe(3000);
  });

  it("returns undefined for missing key", async () => {
    const value = await configCache.get("missing");

    expect(value).toBeUndefined();
  });

  it("checks existence", async () => {
    await configCache.set("app.debug", true);

    expect(await configCache.has("app.debug")).toBe(true);
    expect(await configCache.has("missing")).toBe(false);
  });

  it("invalidates a single key", async () => {
    await configCache.set("key1", "val1");
    await configCache.invalidate("key1");

    expect(await configCache.get("key1")).toBeUndefined();
  });

  it("invalidates multiple keys", async () => {
    await configCache.set("a", "1");
    await configCache.set("b", "2");
    await configCache.invalidateMany(["a", "b"]);

    expect(await configCache.get("a")).toBeUndefined();
    expect(await configCache.get("b")).toBeUndefined();
  });

  it("invalidates all keys", async () => {
    await configCache.set("k1", "v1");
    await configCache.set("k2", "v2");
    await configCache.invalidateAll();

    expect(await configCache.get("k1")).toBeUndefined();
    expect(await configCache.get("k2")).toBeUndefined();
  });

  it("stores complex objects", async () => {
    const obj = { db: { host: "localhost", port: 5432 }, pool: { min: 2, max: 10 } };

    await configCache.set("app.database", obj);

    const value = await configCache.get("app.database");

    expect(value).toEqual(obj);
  });
});
