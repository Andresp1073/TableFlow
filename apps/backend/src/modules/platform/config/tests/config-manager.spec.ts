import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigurationManager } from "../ConfigurationManager.js";
import { InMemorySource } from "../sources/InMemorySource.js";
import { NoopCacheProvider } from "../../cache/NoopCacheProvider.js";
import type { ConfigSchema, ConfigValue, ConfigurationChangeListener, ConfigChangeEvent, ConfigReloadEvent, ConfigValidationError } from "../types.js";

describe("ConfigurationManager", () => {
  let manager: ConfigurationManager;

  beforeEach(() => {
    manager = new ConfigurationManager();
  });

  describe("source management", () => {
    it("adds a source", () => {
      manager.addSource(new InMemorySource("defaults", 100, { key1: "default" }));

      expect(manager.getSources()).toHaveLength(1);
    });

    it("removes a source", () => {
      manager.addSource(new InMemorySource("src1", 50));
      manager.removeSource("src1");

      expect(manager.getSources()).toHaveLength(0);
    });

    it("resolves value from highest priority source", async () => {
      manager.addSource(new InMemorySource("low", 100, { key: "low_value" }));
      manager.addSource(new InMemorySource("high", 10, { key: "high_value" }));

      const value = await manager.provider.get<string>("key");

      expect(value).toBe("high_value");
    });

    it("falls back to lower priority source", async () => {
      manager.addSource(new InMemorySource("defaults", 100, { key: "default" }));

      const value = await manager.provider.get<string>("key");

      expect(value).toBe("default");
    });

    it("returns undefined when no source has the key", async () => {
      const value = await manager.provider.get<string>("missing");

      expect(value).toBeUndefined();
    });
  });

  describe("schema and validation", () => {
    it("registers a schema", () => {
      manager.registerSchema({ key: "app.name", type: "string", required: true });

      const schema = manager.provider.getSchema("app.name");

      expect(schema).toBeDefined();
      expect(schema!.type).toBe("string");
    });

    it("registers multiple schemas", () => {
      manager.registerSchemas([
        { key: "a", type: "string" },
        { key: "b", type: "number" },
      ]);

      expect(manager.provider.getSchema("a")).toBeDefined();
      expect(manager.provider.getSchema("b")).toBeDefined();
    });

    it("uses default value from schema", async () => {
      manager.registerSchema({ key: "app.debug", type: "boolean", defaultValue: false });

      const value = await manager.provider.get<boolean>("app.debug");

      expect(value).toBe(false);
    });

    it("getRequired returns value when present", async () => {
      manager.addSource(new InMemorySource("test", 50, { key: "value" }));

      const value = await manager.provider.getRequired<string>("key");

      expect(value).toBe("value");
    });

    it("getRequired throws when missing", async () => {
      await expect(manager.provider.getRequired<string>("missing")).rejects.toThrow();
    });

    it("getOrDefault returns default when missing", async () => {
      const value = await manager.provider.getOrDefault<string>("missing", "default");

      expect(value).toBe("default");
    });
  });

  describe("getMany and getAll", () => {
    it("getMany returns matching values", async () => {
      manager.addSource(new InMemorySource("test", 50, { a: "1", b: "2", c: "3" }));

      const result = await manager.provider.getMany(["a", "c", "missing"]);

      expect(result.get("a")).toBe("1");
      expect(result.get("c")).toBe("3");
      expect(result.has("missing")).toBe(false);
    });

    it("getAll merges all sources with priority", async () => {
      manager.addSource(new InMemorySource("defaults", 100, { a: "default_a", b: "default_b" }));
      manager.addSource(new InMemorySource("overrides", 0, { a: "override_a" }));

      const all = await manager.provider.getAll();

      expect(all.get("a")).toBe("override_a");
      expect(all.get("b")).toBe("default_b");
    });

    it("getAll includes schema defaults", async () => {
      manager.registerSchema({ key: "with_default", type: "string", defaultValue: "auto" });

      const all = await manager.provider.getAll();

      expect(all.get("with_default")).toBe("auto");
    });
  });

  describe("has", () => {
    it("returns true when key exists", async () => {
      manager.addSource(new InMemorySource("test", 50, { key: "val" }));

      expect(await manager.provider.has("key")).toBe(true);
    });

    it("returns false when key is missing", async () => {
      expect(await manager.provider.has("missing")).toBe(false);
    });
  });

  describe("typed accessors", () => {
    beforeEach(() => {
      manager.addSource(new InMemorySource("test", 50, {
        str: "hello",
        num: 42,
        bool: true,
        duration: { value: 30, unit: "s" },
        arr: [1, 2, 3],
        obj: { a: 1 },
      }));
    });

    it("asString", async () => { expect(await manager.provider.asString("str")).toBe("hello"); });
    it("asNumber", async () => { expect(await manager.provider.asNumber("num")).toBe(42); });
    it("asBoolean", async () => { expect(await manager.provider.asBoolean("bool")).toBe(true); });
    it("asDuration", async () => {
      const d = await manager.provider.asDuration("duration");

      expect(d).toEqual({ value: 30, unit: "s" });
    });
    it("asArray", async () => { expect(await manager.provider.asArray("arr")).toEqual([1, 2, 3]); });
    it("asObject", async () => { expect(await manager.provider.asObject("obj")).toEqual({ a: 1 }); });
    it("asString returns undefined for missing", async () => { expect(await manager.provider.asString("missing")).toBeUndefined(); });
    it("asNumber returns undefined for missing", async () => { expect(await manager.provider.asNumber("missing")).toBeUndefined(); });
  });

  describe("cache integration", () => {
    it("caches values after first read", async () => {
      const cache = new NoopCacheProvider();
      const source = new InMemorySource("test", 50, { key: "value" });

      manager.addSource(source);
      manager = new ConfigurationManager({
        sources: [source],
        cacheProvider: cache,
      });

      const val1 = await manager.provider.get<string>("key");

      expect(val1).toBe("value");

      source.clear();

      const val2 = await manager.provider.get<string>("key");

      expect(val2).toBe("value");
    });
  });

  describe("refresh", () => {
    it("refresh invalidates cache for a key", async () => {
      const cache = new NoopCacheProvider();
      const source = new InMemorySource("test", 50, { key: "original" });

      manager = new ConfigurationManager({
        sources: [source],
        cacheProvider: cache,
      });

      expect(await manager.provider.get<string>("key")).toBe("original");
      source.set("key", "updated");
      await manager.provider.refresh("key");

      expect(await manager.provider.get<string>("key")).toBe("updated");
    });

    it("refreshAll invalidates all cache", async () => {
      const cache = new NoopCacheProvider();
      const source = new InMemorySource("test", 50, { a: "1", b: "2" });

      manager = new ConfigurationManager({
        sources: [source],
        cacheProvider: cache,
      });

      await manager.provider.getAll();
      source.set("a", "updated");
      await manager.provider.refreshAll();

      expect(await manager.provider.get<string>("a")).toBe("updated");
    });
  });

  describe("listeners and events", () => {
    it("registers and notifies change listeners", async () => {
      manager.addSource(new InMemorySource("test", 50, { key: "value" }));

      const listener: ConfigurationChangeListener = {
        name: "test_listener",
        onConfigChanged: vi.fn(),
        onConfigReloaded: vi.fn(),
        onValidationFailed: vi.fn(),
      };

      manager.registerListener(listener);

      await manager.provider.refresh("key");

      expect(listener.onConfigChanged).toHaveBeenCalled();
    });

    it("registers and notifies reload listeners", async () => {
      const listener: ConfigurationChangeListener = {
        name: "reload_listener",
        onConfigChanged: vi.fn(),
        onConfigReloaded: vi.fn(),
        onValidationFailed: vi.fn(),
      };

      manager.registerListener(listener);
      await manager.provider.refreshAll();

      expect(listener.onConfigReloaded).toHaveBeenCalled();
    });

    it("unregisters a listener", async () => {
      const listener: ConfigurationChangeListener = {
        name: "to_remove",
        onConfigChanged: vi.fn(),
        onConfigReloaded: vi.fn(),
        onValidationFailed: vi.fn(),
      };

      manager.registerListener(listener);
      manager.unregisterListener("to_remove");
      await manager.provider.refresh("key");

      expect(listener.onConfigChanged).not.toHaveBeenCalled();
    });
  });

  describe("event publishing", () => {
    it("publishes events when publisher is configured", async () => {
      const publish = vi.fn();
      const source = new InMemorySource("test", 50, { key: "val" });

      manager = new ConfigurationManager({
        sources: [source],
        eventPublisher: { publish, publishMany: vi.fn() },
      });

      await manager.provider.refresh("key");

      expect(publish).toHaveBeenCalled();
      const event = publish.mock.calls[0][0];

      expect(event.type).toBe("configuration_changed");
    });
  });
});
