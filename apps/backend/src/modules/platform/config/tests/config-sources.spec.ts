import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySource } from "../sources/InMemorySource.js";
import { EnvironmentSource } from "../sources/EnvironmentSource.js";

describe("InMemorySource", () => {
  let source: InMemorySource;

  beforeEach(() => {
    source = new InMemorySource("test", 50, { key1: "value1", key2: 42, key3: true });
  });

  it("returns a value by key", async () => {
    expect(await source.get("key1")).toBe("value1");
    expect(await source.get("key2")).toBe(42);
    expect(await source.get("key3")).toBe(true);
  });

  it("returns undefined for missing key", async () => {
    expect(await source.get("missing")).toBeUndefined();
  });

  it("checks key existence", async () => {
    expect(await source.has("key1")).toBe(true);
    expect(await source.has("missing")).toBe(false);
  });

  it("returns all values", async () => {
    const all = await source.getAll();

    expect(all.size).toBe(3);
    expect(all.get("key1")).toBe("value1");
  });

  it("sets and retrieves a value", async () => {
    source.set("key4", "new_value");

    expect(await source.get("key4")).toBe("new_value");
  });

  it("sets multiple values", async () => {
    source.setMany({ a: "1", b: "2" });

    expect(await source.get("a")).toBe("1");
    expect(await source.get("b")).toBe("2");
  });

  it("deletes a value", () => {
    expect(source.delete("key1")).toBe(true);
    expect(source.delete("missing")).toBe(false);
  });

  it("reports size", () => {
    expect(source.size()).toBe(3);

    source.set("new", "val");

    expect(source.size()).toBe(4);
  });

  it("clears all values", () => {
    source.clear();

    expect(source.size()).toBe(0);
  });

  it("has correct name and priority", () => {
    expect(source.name).toBe("test");
    expect(source.priority).toBe(50);
    expect(source.enabled).toBe(true);
  });
});

describe("EnvironmentSource", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reads values from environment", async () => {
    process.env["APP_PORT"] = "3000";
    process.env["APP_DEBUG"] = "true";
    process.env["APP_NAME"] = "TableFlow";

    const source = new EnvironmentSource(10, "APP_");

    expect(await source.get("port")).toBe(3000);
    expect(await source.get("debug")).toBe(true);
    expect(await source.get("name")).toBe("TableFlow");
  });

  it("returns undefined for missing key", async () => {
    const source = new EnvironmentSource(10, "APP_");

    expect(await source.get("nonexistent")).toBeUndefined();
  });

  it("checks key existence", async () => {
    process.env["MY_KEY"] = "value";
    const source = new EnvironmentSource(10, "");

    expect(await source.has("my_key")).toBe(true);
    expect(await source.has("missing_key")).toBe(false);
  });

  it("returns all matching values", async () => {
    process.env["CFG_HOST"] = "localhost";
    process.env["CFG_PORT"] = "8080";
    process.env["OTHER"] = "ignored";

    const source = new EnvironmentSource(5, "CFG_");

    const all = await source.getAll();

    expect(all.size).toBe(2);
    expect(all.get("host")).toBe("localhost");
    expect(all.get("port")).toBe(8080);
  });

  it("parses JSON values", async () => {
    process.env["APP_ORIGINS"] = '["a","b","c"]';
    const source = new EnvironmentSource(10, "APP_");

    const value = await source.get("origins");

    expect(value).toEqual(["a", "b", "c"]);
  });

  it("converts dotted keys to env format", async () => {
    process.env["APP_DB__HOST"] = "db.example.com";
    const source = new EnvironmentSource(10, "APP_", "__");

    expect(await source.get("db.host")).toBe("db.example.com");
  });

  it("has correct name and priority", () => {
    const source = new EnvironmentSource(0, "");

    expect(source.name).toBe("environment");
    expect(source.priority).toBe(0);
    expect(source.enabled).toBe(true);
  });
});
