import { describe, it, expect } from "vitest";
import { TableTypeName } from "../domain/models/TableTypeName.js";
import { TableTypeCode } from "../domain/models/TableTypeCode.js";
import { TableCapacity } from "../domain/models/TableCapacity.js";
import { TableShape } from "../domain/models/TableShape.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";
import { TableTypeStatus } from "../domain/models/TableTypeStatus.js";

describe("TableTypeName", () => {
  it("creates from valid name", () => {
    const name = TableTypeName.create("VIP Room");
    expect(name.value).toBe("VIP Room");
  });

  it("trims whitespace", () => {
    const name = TableTypeName.create("  Standard  ");
    expect(name.value).toBe("Standard");
  });

  it("rejects empty name", () => {
    expect(() => TableTypeName.create("")).toThrow("must not be empty");
  });

  it("rejects name exceeding 100 characters", () => {
    expect(() => TableTypeName.create("a".repeat(101))).toThrow("must not exceed 100 characters");
  });

  it("compares equality case-insensitively", () => {
    const a = TableTypeName.create("VIP");
    const b = TableTypeName.create("vip");
    expect(a.equals(b)).toBe(true);
  });

  it("reconstitutes without validation", () => {
    const name = TableTypeName.reconstitute("Any Value");
    expect(name.value).toBe("Any Value");
  });
});

describe("TableTypeCode", () => {
  it("creates from valid code", () => {
    const code = TableTypeCode.create("VIP_01");
    expect(code.value).toBe("VIP_01");
  });

  it("uppercases the code", () => {
    const code = TableTypeCode.create("vip");
    expect(code.value).toBe("VIP");
  });

  it("rejects empty code", () => {
    expect(() => TableTypeCode.create("")).toThrow("must not be empty");
  });

  it("rejects code exceeding 30 characters", () => {
    expect(() => TableTypeCode.create("A".repeat(31))).toThrow("must not exceed 30 characters");
  });

  it("rejects code with invalid characters", () => {
    expect(() => TableTypeCode.create("VIP TABLE")).toThrow();
  });

  it("reconstitutes without validation", () => {
    const code = TableTypeCode.reconstitute("ANY_CODE");
    expect(code.value).toBe("ANY_CODE");
  });
});

describe("TableCapacity", () => {
  it("creates from valid capacity", () => {
    const cap = TableCapacity.create(4);
    expect(cap.value).toBe(4);
  });

  it("rejects zero capacity", () => {
    expect(() => TableCapacity.create(0)).toThrow("at least 1");
  });

  it("rejects negative capacity", () => {
    expect(() => TableCapacity.create(-1)).toThrow("at least 1");
  });

  it("rejects non-integer capacity", () => {
    expect(() => TableCapacity.create(2.5)).toThrow("must be an integer");
  });

  it("rejects capacity exceeding 999", () => {
    expect(() => TableCapacity.create(1000)).toThrow("must not exceed 999");
  });

  it("accepts capacity of 999", () => {
    const cap = TableCapacity.create(999);
    expect(cap.value).toBe(999);
  });

  it("reconstitutes without validation", () => {
    const cap = TableCapacity.reconstitute(6);
    expect(cap.value).toBe(6);
  });
});

describe("TableShape", () => {
  it("creates from valid shape", () => {
    const shape = TableShape.create("round");
    expect(shape.value).toBe("round");
  });

  it("accepts all valid shapes", () => {
    const valid = ["square", "rectangle", "round", "oval", "custom"];
    for (const s of valid) {
      expect(TableShape.create(s).value).toBe(s);
    }
  });

  it("rejects invalid shape", () => {
    expect(() => TableShape.create("hexagon")).toThrow("Invalid table shape");
  });

  it("normalizes case", () => {
    const shape = TableShape.create("ROUND");
    expect(shape.value).toBe("round");
  });

  it("reconstitutes without validation", () => {
    const shape = TableShape.reconstitute("square");
    expect(shape.value).toBe("square");
  });
});

describe("DisplayOrder", () => {
  it("creates from valid order", () => {
    const order = DisplayOrder.create(1);
    expect(order.value).toBe(1);
  });

  it("rejects negative order", () => {
    expect(() => DisplayOrder.create(-1)).toThrow("must not be negative");
  });

  it("rejects non-integer order", () => {
    expect(() => DisplayOrder.create(1.5)).toThrow("must be an integer");
  });

  it("rejects order exceeding 9999", () => {
    expect(() => DisplayOrder.create(10000)).toThrow("must not exceed 9999");
  });

  it("accepts order of 0", () => {
    const order = DisplayOrder.create(0);
    expect(order.value).toBe(0);
  });

  it("reconstitutes without validation", () => {
    const order = DisplayOrder.reconstitute(5);
    expect(order.value).toBe(5);
  });
});

describe("TableTypeStatus", () => {
  it("creates from valid status", () => {
    const status = TableTypeStatus.create("active");
    expect(status.value).toBe("active");
  });

  it("rejects invalid status", () => {
    expect(() => TableTypeStatus.create("deleted")).toThrow("Invalid table type status");
  });

  it("allows active to archived transition", () => {
    const active = TableTypeStatus.create("active");
    const archived = TableTypeStatus.create("archived");
    expect(active.canTransitionTo(archived)).toBe(true);
  });

  it("disallows archived to active transition", () => {
    const archived = TableTypeStatus.create("archived");
    const active = TableTypeStatus.create("active");
    expect(archived.canTransitionTo(active)).toBe(false);
  });

  it("isActive returns true for active", () => {
    expect(TableTypeStatus.create("active").isActive()).toBe(true);
  });

  it("isArchived returns true for archived", () => {
    expect(TableTypeStatus.create("archived").isArchived()).toBe(true);
  });

  it("reconstitutes without validation", () => {
    const status = TableTypeStatus.reconstitute("active");
    expect(status.value).toBe("active");
  });
});
