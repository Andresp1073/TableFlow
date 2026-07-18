import { describe, it, expect } from "vitest";
import { TableStateMachine } from "../domain/services/TableStateMachine.js";
import { TableTransitionValidator } from "../domain/services/TableTransitionValidator.js";
import { TableStatusPolicy } from "../domain/services/TableStatusPolicy.js";
import { TableStatusEngine } from "../domain/services/TableStatusEngine.js";
import { TableStatus } from "../domain/models/TableStatus.js";
import type { Table } from "../domain/models/Table.js";

function createMockTable(overrides?: Partial<Table>): Table {
  return {
    id: "table-1",
    restaurantId: "rest-1",
    branchId: "branch-1",
    diningAreaId: null,
    tableTypeId: null,
    tableNumber: { value: "T1" } as any,
    name: null,
    description: null,
    minimumCapacity: { value: 2 } as any,
    maximumCapacity: { value: 4 } as any,
    currentCapacity: { value: 4 } as any,
    shape: "rectangle",
    width: 60,
    height: 60,
    position: null,
    rotation: null,
    qrIdentifier: null,
    isReservable: true,
    isAccessible: true,
    isActive: true,
    status: TableStatus.create("available"),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe("TableStateMachine", () => {
  const fsm = new TableStateMachine();

  it("has all 8 states", () => {
    expect(fsm.getStates()).toHaveLength(8);
    expect(fsm.getStates()).toContain("archived");
  });

  it("allows valid transitions", () => {
    expect(fsm.canTransition("available", "reserved")).toBe(true);
    expect(fsm.canTransition("available", "occupied")).toBe(true);
    expect(fsm.canTransition("available", "blocked")).toBe(true);
    expect(fsm.canTransition("available", "maintenance")).toBe(true);
    expect(fsm.canTransition("available", "cleaning")).toBe(true);
    expect(fsm.canTransition("reserved", "occupied")).toBe(true);
    expect(fsm.canTransition("reserved", "available")).toBe(true);
    expect(fsm.canTransition("reserved", "blocked")).toBe(true);
    expect(fsm.canTransition("occupied", "cleaning")).toBe(true);
    expect(fsm.canTransition("occupied", "blocked")).toBe(true);
    expect(fsm.canTransition("cleaning", "available")).toBe(true);
    expect(fsm.canTransition("maintenance", "available")).toBe(true);
    expect(fsm.canTransition("blocked", "available")).toBe(true);
    expect(fsm.canTransition("out_of_service", "available")).toBe(true);
    expect(fsm.canTransition("out_of_service", "maintenance")).toBe(true);
  });

  it("allows same-state transition (no-op)", () => {
    expect(fsm.canTransition("available", "available")).toBe(true);
    expect(fsm.canTransition("archived", "archived")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(fsm.canTransition("available", "archived")).toBe(false);
    expect(fsm.canTransition("occupied", "reserved")).toBe(false);
    expect(fsm.canTransition("occupied", "available")).toBe(false);
    expect(fsm.canTransition("reserved", "cleaning")).toBe(false);
    expect(fsm.canTransition("reserved", "maintenance")).toBe(false);
    expect(fsm.canTransition("cleaning", "occupied")).toBe(false);
    expect(fsm.canTransition("cleaning", "blocked")).toBe(false);
    expect(fsm.canTransition("maintenance", "blocked")).toBe(false);
    expect(fsm.canTransition("blocked", "occupied")).toBe(false);
    expect(fsm.canTransition("archived", "available")).toBe(false);
    expect(fsm.canTransition("archived", "anything" as any)).toBe(false);
  });

  it("getAllowedTransitionsFrom returns correct list", () => {
    expect(fsm.getAllowedTransitionsFrom("available")).toEqual([
      "reserved", "occupied", "blocked", "maintenance", "cleaning",
    ]);
    expect(fsm.getAllowedTransitionsFrom("archived")).toEqual([]);
  });

  it("isTerminal for archived", () => {
    expect(fsm.isTerminal("archived")).toBe(true);
    expect(fsm.isTerminal("available")).toBe(false);
  });

  it("getAllowedTransitions returns all transitions", () => {
    const all = fsm.getAllowedTransitions();
    expect(all.length).toBeGreaterThan(0);
    expect(all.find((t) => t.from === "available" && t.to === "reserved")).toBeDefined();
    expect(all.find((t) => t.from === "archived")).toBeUndefined();
  });
});

describe("TableTransitionValidator", () => {
  const validator = new TableTransitionValidator();

  it("validates a correct transition", () => {
    const result = validator.validate("available", "occupied");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects same status", () => {
    const result = validator.validate("available", "available");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("already in this status");
  });

  it("rejects invalid source status", () => {
    const result = validator.validate("invalid", "occupied");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid source status");
  });

  it("rejects invalid target status", () => {
    const result = validator.validate("available", "invalid");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid target status");
  });

  it("rejects invalid transition", () => {
    const result = validator.validate("available", "archived");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Cannot transition");
  });

  it("rejects deleted table", () => {
    const result = validator.validateTransitionOnDeleted(new Date());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("deleted");
  });

  it("allows non-deleted table", () => {
    const result = validator.validateTransitionOnDeleted(null);
    expect(result.valid).toBe(true);
  });

  it("rejects terminal state", () => {
    const result = validator.validateTransitionOnTerminal("archived");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("terminal state");
  });

  it("allows non-terminal state", () => {
    const result = validator.validateTransitionOnTerminal("available");
    expect(result.valid).toBe(true);
  });
});

describe("TableStatusPolicy", () => {
  const policy = new TableStatusPolicy();

  it("allows transition on non-terminal states", () => {
    expect(policy.canTransitionOnTable("available").allowed).toBe(true);
    expect(policy.canTransitionOnTable("occupied").allowed).toBe(true);
  });

  it("rejects transition on terminal (archived)", () => {
    const result = policy.canTransitionOnTable("archived");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("archived");
  });

  it("canServeGuests only for available", () => {
    expect(policy.canServeGuests("available").allowed).toBe(true);
    expect(policy.canServeGuests("occupied").allowed).toBe(false);
  });

  it("canBeReserved only for available", () => {
    expect(policy.canBeReserved("available").allowed).toBe(true);
    expect(policy.canBeReserved("reserved").allowed).toBe(false);
  });

  it("isAvailableTransition", () => {
    expect(policy.isAvailableTransition("cleaning", "available")).toBe(true);
    expect(policy.isAvailableTransition("available", "occupied")).toBe(false);
  });

  it("requiresCleaning", () => {
    expect(policy.requiresCleaning("cleaning")).toBe(true);
    expect(policy.requiresCleaning("available")).toBe(false);
  });

  it("isMaintenanceRequired", () => {
    expect(policy.isMaintenanceRequired("maintenance")).toBe(true);
    expect(policy.isMaintenanceRequired("out_of_service")).toBe(true);
    expect(policy.isMaintenanceRequired("available")).toBe(false);
  });

  it("canBeMerged only for available", () => {
    expect(policy.canBeMerged("available").allowed).toBe(true);
    expect(policy.canBeMerged("occupied").allowed).toBe(false);
  });
});

describe("TableStatusEngine", () => {
  const engine = new TableStatusEngine();

  it("changes status for valid transition", () => {
    const table = createMockTable({ status: TableStatus.create("available") });
    const result = engine.changeStatus(table, "occupied");
    expect(result.previousStatus).toBe("available");
    expect(result.newStatus).toBe("occupied");
    expect(result.table.status.value).toBe("occupied");
    expect(result.table.updatedAt).toBeInstanceOf(Date);
  });

  it("changes status from reserved to occupied", () => {
    const table = createMockTable({ status: TableStatus.create("reserved") });
    const result = engine.changeStatus(table, "occupied");
    expect(result.newStatus).toBe("occupied");
  });

  it("changes status from occupied to cleaning", () => {
    const table = createMockTable({ status: TableStatus.create("occupied") });
    const result = engine.changeStatus(table, "cleaning");
    expect(result.newStatus).toBe("cleaning");
  });

  it("changes status from cleaning to available", () => {
    const table = createMockTable({ status: TableStatus.create("cleaning") });
    const result = engine.changeStatus(table, "available");
    expect(result.newStatus).toBe("available");
    expect(result.table.isActive).toBe(true);
  });

  it("changes status from out_of_service to available", () => {
    const table = createMockTable({ status: TableStatus.create("out_of_service") });
    const result = engine.changeStatus(table, "available");
    expect(result.newStatus).toBe("available");
  });

  it("throws for deleted table", () => {
    const table = createMockTable({ status: TableStatus.create("available"), deletedAt: new Date() });
    expect(() => engine.changeStatus(table, "occupied")).toThrow("deleted");
  });

  it("throws for terminal (archived) table", () => {
    const table = createMockTable({ status: TableStatus.create("archived") });
    expect(() => engine.changeStatus(table, "available")).toThrow("terminal");
  });

  it("throws for invalid transition", () => {
    const table = createMockTable({ status: TableStatus.create("available") });
    expect(() => engine.changeStatus(table, "archived")).toThrow("Cannot transition");
  });

  it("throws for invalid status value", () => {
    const table = createMockTable({ status: TableStatus.create("available") });
    expect(() => engine.changeStatus(table, "invalid")).toThrow("Invalid table status");
  });

  it("sets isActive to false when transitioning to archived", () => {
    const table = createMockTable({ status: TableStatus.create("available") });
    expect(() => engine.changeStatus(table, "archived")).toThrow("Cannot transition");
  });

  it("getAvailableTransitions returns correct list", () => {
    const transitions = engine.getAvailableTransitions("available");
    expect(transitions).toEqual(["reserved", "occupied", "blocked", "maintenance", "cleaning"]);
  });

  it("getAvailableTransitions returns empty for archived", () => {
    const transitions = engine.getAvailableTransitions("archived");
    expect(transitions).toEqual([]);
  });

  it("provides access to sub-services", () => {
    expect(engine.getStateMachine()).toBeInstanceOf(TableStateMachine);
    expect(engine.getTransitionValidator()).toBeInstanceOf(TableTransitionValidator);
    expect(engine.getStatusPolicy()).toBeInstanceOf(TableStatusPolicy);
  });
});
