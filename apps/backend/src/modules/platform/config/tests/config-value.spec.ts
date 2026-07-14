import { describe, it, expect } from "vitest";
import { createDuration, durationToMs, durationToString, parseDuration, coerceValue } from "../ConfigValue.js";

describe("ConfigValue", () => {
  describe("createDuration", () => {
    it("creates a duration config", () => {
      const d = createDuration(30, "s");

      expect(d.value).toBe(30);
      expect(d.unit).toBe("s");
    });
  });

  describe("durationToMs", () => {
    it("converts ms", () => { expect(durationToMs(createDuration(500, "ms"))).toBe(500); });
    it("converts seconds", () => { expect(durationToMs(createDuration(2, "s"))).toBe(2000); });
    it("converts minutes", () => { expect(durationToMs(createDuration(5, "m"))).toBe(300_000); });
    it("converts hours", () => { expect(durationToMs(createDuration(1, "h"))).toBe(3_600_000); });
    it("converts days", () => { expect(durationToMs(createDuration(1, "d"))).toBe(86_400_000); });
  });

  describe("durationToString", () => {
    it("formats duration", () => {
      expect(durationToString(createDuration(30, "s"))).toBe("30s");
      expect(durationToString(createDuration(5, "m"))).toBe("5m");
    });
  });

  describe("parseDuration", () => {
    it("parses valid duration strings", () => {
      expect(parseDuration("30s")).toEqual({ value: 30, unit: "s" });
      expect(parseDuration("5m")).toEqual({ value: 5, unit: "m" });
      expect(parseDuration("1h")).toEqual({ value: 1, unit: "h" });
      expect(parseDuration("2d")).toEqual({ value: 2, unit: "d" });
      expect(parseDuration("500 ms")).toEqual({ value: 500, unit: "ms" });
    });

    it("returns undefined for invalid strings", () => {
      expect(parseDuration("abc")).toBeUndefined();
      expect(parseDuration("")).toBeUndefined();
      expect(parseDuration("30")).toBeUndefined();
    });
  });

  describe("coerceValue", () => {
    it("coerces to string", () => {
      expect(coerceValue(42, "string")).toBe("42");
      expect(coerceValue(true, "string")).toBe("true");
      expect(coerceValue("hello", "string")).toBe("hello");
    });

    it("coerces to number", () => {
      expect(coerceValue("42", "number")).toBe(42);
      expect(coerceValue(42, "number")).toBe(42);
      expect(coerceValue("abc", "number")).toBeUndefined();
    });

    it("coerces to boolean", () => {
      expect(coerceValue("true", "boolean")).toBe(true);
      expect(coerceValue("false", "boolean")).toBe(false);
      expect(coerceValue("1", "boolean")).toBe(true);
      expect(coerceValue("0", "boolean")).toBe(false);
      expect(coerceValue(true, "boolean")).toBe(true);
      expect(coerceValue(false, "boolean")).toBe(false);
      expect(coerceValue(1, "boolean")).toBe(true);
      expect(coerceValue(0, "boolean")).toBe(false);
    });

    it("coerces to duration", () => {
      const d = createDuration(30, "s");

      expect(coerceValue(d, "duration")).toEqual(d);
      expect(coerceValue("30s", "duration")).toEqual(d);
      expect(coerceValue("abc", "duration")).toBeUndefined();
    });

    it("coerces to array", () => {
      expect(coerceValue([1, 2], "array")).toEqual([1, 2]);
      expect(coerceValue('["a","b"]', "array")).toEqual(["a", "b"]);
      expect(coerceValue("a,b,c", "array")).toEqual(["a", "b", "c"]);
      expect(coerceValue(42, "array")).toEqual([42]);
    });

    it("coerces to object", () => {
      expect(coerceValue({ a: 1 }, "object")).toEqual({ a: 1 });
      expect(coerceValue('{"a":1}', "object")).toEqual({ a: 1 });
      expect(coerceValue("invalid", "object")).toBeUndefined();
    });

    it("returns null/undefined as-is", () => {
      expect(coerceValue(null, "string")).toBeNull();
      expect(coerceValue(undefined, "string")).toBeUndefined();
    });
  });
});
