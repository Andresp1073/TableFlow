import { describe, it, expect } from "vitest";
import { DiningAreaName } from "../domain/models/DiningAreaName.js";
import { DiningAreaCode } from "../domain/models/DiningAreaCode.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";
import { DiningAreaStatus } from "../domain/models/DiningAreaStatus.js";

describe("DiningAreaName", () => {
  it("creates from valid name", () => {
    const name = DiningAreaName.create("Main Hall");
    expect(name.value).toBe("Main Hall");
  });

  it("trims whitespace", () => {
    const name = DiningAreaName.create("  Terrace  ");
    expect(name.value).toBe("Terrace");
  });

  it("throws for empty name", () => {
    expect(() => DiningAreaName.create("")).toThrow();
    expect(() => DiningAreaName.create("   ")).toThrow();
  });

  it("throws for name exceeding 100 chars", () => {
    expect(() => DiningAreaName.create("a".repeat(101))).toThrow();
  });

  it("accepts name at exactly 100 chars", () => {
    const name = DiningAreaName.create("a".repeat(100));
    expect(name.value.length).toBe(100);
  });

  it("equals is case-insensitive", () => {
    const a = DiningAreaName.create("Main Hall");
    const b = DiningAreaName.create("main hall");
    expect(a.equals(b)).toBe(true);
  });

  it("reconstitute creates without validation", () => {
    const name = DiningAreaName.reconstitute("Any Name");
    expect(name.value).toBe("Any Name");
  });
});

describe("DiningAreaCode", () => {
  it("creates from valid code", () => {
    const code = DiningAreaCode.create("MAIN_HALL");
    expect(code.value).toBe("MAIN_HALL");
  });

  it("uppercases on creation", () => {
    const code = DiningAreaCode.create("main-hall");
    expect(code.value).toBe("MAIN-HALL");
  });

  it("throws for empty code", () => {
    expect(() => DiningAreaCode.create("")).toThrow();
  });

  it("throws for code exceeding 30 chars", () => {
    expect(() => DiningAreaCode.create("A".repeat(31))).toThrow();
  });

  it("accepts single character code", () => {
    const code = DiningAreaCode.create("A");
    expect(code.value).toBe("A");
  });

  it("accepts alphanumeric with underscore and hyphen", () => {
    const code = DiningAreaCode.create("VIP-LOUNGE_2");
    expect(code.value).toBe("VIP-LOUNGE_2");
  });

  it("reconstitute creates without validation", () => {
    const code = DiningAreaCode.reconstitute("EXISTING");
    expect(code.value).toBe("EXISTING");
  });
});

describe("DisplayOrder", () => {
  it("creates from valid order", () => {
    const order = DisplayOrder.create(1);
    expect(order.value).toBe(1);
  });

  it("accepts 0", () => {
    const order = DisplayOrder.create(0);
    expect(order.value).toBe(0);
  });

  it("throws for negative", () => {
    expect(() => DisplayOrder.create(-1)).toThrow();
  });

  it("throws for exceeding 9999", () => {
    expect(() => DisplayOrder.create(10000)).toThrow();
  });

  it("throws for non-integer", () => {
    expect(() => DisplayOrder.create(1.5)).toThrow();
  });

  it("reconstitute creates without validation", () => {
    const order = DisplayOrder.reconstitute(42);
    expect(order.value).toBe(42);
  });
});

describe("DiningAreaStatus", () => {
  it("creates active status", () => {
    const status = DiningAreaStatus.create("active");
    expect(status.value).toBe("active");
    expect(status.isActive()).toBe(true);
    expect(status.isArchived()).toBe(false);
  });

  it("creates archived status", () => {
    const status = DiningAreaStatus.create("archived");
    expect(status.value).toBe("archived");
    expect(status.isActive()).toBe(false);
    expect(status.isArchived()).toBe(true);
  });

  it("throws for invalid status", () => {
    expect(() => DiningAreaStatus.create("deleted")).toThrow();
  });

  it("is case insensitive", () => {
    const status = DiningAreaStatus.create("ACTIVE");
    expect(status.value).toBe("active");
  });

  it("allows active -> archived transition", () => {
    const active = DiningAreaStatus.create("active");
    const archived = DiningAreaStatus.create("archived");
    expect(active.canTransitionTo(archived)).toBe(true);
  });

  it("rejects archived -> active transition", () => {
    const archived = DiningAreaStatus.create("archived");
    const active = DiningAreaStatus.create("active");
    expect(archived.canTransitionTo(active)).toBe(false);
  });

  it("rejects active -> active transition", () => {
    const active = DiningAreaStatus.create("active");
    expect(active.canTransitionTo(active)).toBe(false);
  });

  it("reconstitute creates without validation", () => {
    const status = DiningAreaStatus.reconstitute("archived");
    expect(status.value).toBe("archived");
  });
});
