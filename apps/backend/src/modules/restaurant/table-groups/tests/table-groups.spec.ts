import { describe, it, expect } from "vitest";
import { TableGroupStatus } from "../domain/models/TableGroupStatus.js";
import { TableGroupName } from "../domain/models/TableGroupName.js";
import { TableGroupId } from "../domain/models/TableGroupId.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";
import { TableGroupRules } from "../domain/services/TableGroupRules.js";
import { TableGroupingPolicy } from "../domain/services/TableGroupingPolicy.js";
import { GroupCapacityCalculator } from "../domain/services/GroupCapacityCalculator.js";
import { InsufficientTablesError } from "../errors/InsufficientTablesError.js";
import { DuplicateTableInGroupError } from "../errors/DuplicateTableInGroupError.js";
import { InvalidRestaurantGroupError } from "../errors/InvalidRestaurantGroupError.js";
import { InvalidTableGroupError } from "../errors/InvalidTableGroupError.js";

describe("TableGroupStatus", () => {
  it("creates valid statuses", () => {
    expect(TableGroupStatus.create("active").value).toBe("active");
    expect(TableGroupStatus.create("reserved").value).toBe("reserved");
    expect(TableGroupStatus.create("occupied").value).toBe("occupied");
    expect(TableGroupStatus.create("released").value).toBe("released");
    expect(TableGroupStatus.create("archived").value).toBe("archived");
  });

  it("throws for invalid status", () => {
    expect(() => TableGroupStatus.create("invalid")).toThrow();
    expect(() => TableGroupStatus.create("")).toThrow();
    expect(() => TableGroupStatus.create("deleted")).toThrow();
  });

  it("normalizes whitespace and case", () => {
    expect(TableGroupStatus.create("  ACTIVE  ").value).toBe("active");
  });

  it("checks transition validity", () => {
    const active = TableGroupStatus.create("active");
    expect(active.isTransitionValid("reserved")).toBe(true);
    expect(active.isTransitionValid("occupied")).toBe(true);
    expect(active.isTransitionValid("released")).toBe(true);
    expect(active.isTransitionValid("archived")).toBe(true);

    const archived = TableGroupStatus.create("archived");
    expect(archived.isTransitionValid("active")).toBe(false);
  });

  it("detects terminal states", () => {
    expect(TableGroupStatus.create("released").isTerminal()).toBe(true);
    expect(TableGroupStatus.create("archived").isTerminal()).toBe(true);
    expect(TableGroupStatus.create("active").isTerminal()).toBe(false);
  });
});

describe("TableGroupName", () => {
  it("creates valid name", () => {
    const name = TableGroupName.create("VIP Section Merge");
    expect(name.value).toBe("VIP Section Merge");
  });

  it("trims whitespace", () => {
    const name = TableGroupName.create("  Party Area  ");
    expect(name.value).toBe("Party Area");
  });

  it("throws for empty name", () => {
    expect(() => TableGroupName.create("")).toThrow();
    expect(() => TableGroupName.create("   ")).toThrow();
  });

  it("throws for long name", () => {
    expect(() => TableGroupName.create("a".repeat(101))).toThrow();
  });

  it("equals case-insensitively", () => {
    expect(TableGroupName.create("Test").equals(TableGroupName.create("test"))).toBe(true);
  });
});

describe("TableGroupId", () => {
  it("creates from valid UUID", () => {
    const id = TableGroupId.create("550e8400-e29b-41d4-a716-446655440000");
    expect(id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("throws for non-UUID value", () => {
    expect(() => TableGroupId.create("not-a-uuid")).toThrow();
    expect(() => TableGroupId.create("")).toThrow();
    expect(() => TableGroupId.create("group-1")).toThrow();
  });

  it("reconstitutes from stored value without validation", () => {
    const id = TableGroupId.reconstitute("existing-group-id");
    expect(id.value).toBe("existing-group-id");
  });

  it("checks equality", () => {
    const a = TableGroupId.reconstitute("550e8400-e29b-41d4-a716-446655440000");
    const b = TableGroupId.reconstitute("550e8400-e29b-41d4-a716-446655440000");
    const c = TableGroupId.reconstitute("550e8400-e29b-41d4-a716-446655440001");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe("DisplayOrder", () => {
  it("creates valid order", () => {
    expect(DisplayOrder.create(0).value).toBe(0);
    expect(DisplayOrder.create(1).value).toBe(1);
    expect(DisplayOrder.create(9999).value).toBe(9999);
  });

  it("throws for negative values", () => {
    expect(() => DisplayOrder.create(-1)).toThrow();
  });

  it("throws for non-integer", () => {
    expect(() => DisplayOrder.create(1.5)).toThrow();
  });

  it("throws for out of range", () => {
    expect(() => DisplayOrder.create(10000)).toThrow();
  });

  it("reconstitutes from stored value", () => {
    expect(DisplayOrder.reconstitute(5).value).toBe(5);
  });

  it("checks equality", () => {
    expect(DisplayOrder.create(1).equals(DisplayOrder.create(1))).toBe(true);
    expect(DisplayOrder.create(1).equals(DisplayOrder.create(2))).toBe(false);
  });
});

describe("TableGroupingPolicy", () => {
  const policy = new TableGroupingPolicy();

  it("validates minimum 2 members", () => {
    expect(() =>
      policy.validateMinimumMembers([
        { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
      ]),
    ).toThrow(InsufficientTablesError);

    expect(() =>
      policy.validateMinimumMembers([
        { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
        { tableId: "t-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
      ]),
    ).not.toThrow();
  });

  it("validates no duplicate tables", () => {
    expect(() =>
      policy.validateNoDuplicateTables([
        { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
        { tableId: "t-1", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
      ]),
    ).toThrow(DuplicateTableInGroupError);

    expect(() =>
      policy.validateNoDuplicateTables([
        { tableId: "t-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date() },
        { tableId: "t-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date() },
      ]),
    ).not.toThrow();
  });

  it("validates all tables belong to same restaurant", () => {
    const tables = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "available" } },
      { id: "t-2", restaurantId: "rest-1", status: { value: "available" } },
    ];

    expect(() =>
      policy.validateSameRestaurant(tables, "rest-1"),
    ).not.toThrow();

    expect(() =>
      policy.validateSameRestaurant(
        [...tables, { id: "t-3", restaurantId: "rest-2", status: { value: "available" } }],
        "rest-1",
      ),
    ).toThrow(InvalidRestaurantGroupError);
  });

  it("refuses archived tables", () => {
    const tables = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "archived" } },
    ];
    expect(() => policy.validateNoArchivedTables(tables)).toThrow(InvalidTableGroupError);
  });

  it("allows non-archived tables", () => {
    const tables = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "available" } },
    ];
    expect(() => policy.validateNoArchivedTables(tables)).not.toThrow();
  });

  it("validates tables not in active group", () => {
    expect(() =>
      policy.validateTablesNotInActiveGroup(
        [{ id: "t-1", restaurantId: "rest-1", status: { value: "available" } }],
        ["t-2"],
      ),
    ).not.toThrow();

    expect(() =>
      policy.validateTablesNotInActiveGroup(
        [{ id: "t-1", restaurantId: "rest-1", status: { value: "available" } }],
        ["t-1"],
      ),
    ).toThrow(InvalidTableGroupError);
  });

  it("validates not terminal", () => {
    expect(() =>
      policy.validateNotTerminal(TableGroupStatus.create("active")),
    ).not.toThrow();

    expect(() =>
      policy.validateNotTerminal(TableGroupStatus.create("released")),
    ).toThrow("Cannot modify");

    expect(() =>
      policy.validateNotTerminal(TableGroupStatus.create("archived")),
    ).toThrow("Cannot modify");
  });
});

describe("GroupCapacityCalculator", () => {
  const calculator = new GroupCapacityCalculator();

  it("sums capacities from member tables", () => {
    const tables = [
      { maximumCapacity: { value: 4 } },
      { maximumCapacity: { value: 6 } },
      { maximumCapacity: { value: 2 } },
    ];
    expect(calculator.calculate(tables)).toBe(12);
  });

  it("returns 0 for empty list", () => {
    expect(calculator.calculate([])).toBe(0);
  });
});

describe("TableGroupRules (legacy)", () => {
  it("validates minimum 2 members", () => {
    expect(() =>
      TableGroupRules.validateMinimumMembers([
        { tableId: "t-1", displayOrder: 1 },
      ]),
    ).toThrow("at least 2 tables");

    expect(() =>
      TableGroupRules.validateMinimumMembers([
        { tableId: "t-1", displayOrder: 1 },
        { tableId: "t-2", displayOrder: 2 },
      ]),
    ).not.toThrow();
  });

  it("validates no duplicate tables", () => {
    expect(() =>
      TableGroupRules.validateNoDuplicateTables([
        { tableId: "t-1", displayOrder: 1 },
        { tableId: "t-1", displayOrder: 2 },
      ]),
    ).toThrow("appears more than once");

    expect(() =>
      TableGroupRules.validateNoDuplicateTables([
        { tableId: "t-1", displayOrder: 1 },
        { tableId: "t-2", displayOrder: 2 },
      ]),
    ).not.toThrow();
  });

  it("validates all tables belong to same restaurant", () => {
    const tables = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "available" } },
      { id: "t-2", restaurantId: "rest-1", status: { value: "available" } },
    ];

    expect(() =>
      TableGroupRules.validateAllTablesSameRestaurant(tables, "rest-1"),
    ).not.toThrow();

    expect(() =>
      TableGroupRules.validateAllTablesSameRestaurant(
        [...tables, { id: "t-3", restaurantId: "rest-2", status: { value: "available" } }],
        "rest-1",
      ),
    ).toThrow("belongs to restaurant");
  });

  it("validates tables not in active group", () => {
    const tables = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "available" } },
      { id: "t-2", restaurantId: "rest-1", status: { value: "available" } },
    ];

    expect(() =>
      TableGroupRules.validateTablesNotInActiveGroup(tables, ["t-3"]),
    ).not.toThrow();

    expect(() =>
      TableGroupRules.validateTablesNotInActiveGroup(tables, ["t-1"]),
    ).toThrow("already part of an active group");
  });

  it("validates table status prevents occupied and maintenance", () => {
    const valid = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "available" } },
      { id: "t-2", restaurantId: "rest-1", status: { value: "reserved" } },
    ];
    expect(() => TableGroupRules.validateTablesStatus(valid)).not.toThrow();

    const occupied = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "occupied" } },
    ];
    expect(() => TableGroupRules.validateTablesStatus(occupied)).toThrow("occupied");

    const maintenance = [
      { id: "t-1", restaurantId: "rest-1", status: { value: "maintenance" } },
    ];
    expect(() => TableGroupRules.validateTablesStatus(maintenance)).toThrow("maintenance");
  });

  it("validates not terminal", () => {
    expect(() =>
      TableGroupRules.validateNotTerminal(TableGroupStatus.create("active")),
    ).not.toThrow();

    expect(() =>
      TableGroupRules.validateNotTerminal(TableGroupStatus.create("released")),
    ).toThrow("Cannot modify");

    expect(() =>
      TableGroupRules.validateNotTerminal(TableGroupStatus.create("archived")),
    ).toThrow("Cannot modify");
  });
});
