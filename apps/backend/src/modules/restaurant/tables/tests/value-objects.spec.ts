import { describe, it, expect } from "vitest";
import { TableStatus } from "../domain/models/TableStatus.js";

describe("TableStatus", () => {
  describe("create", () => {
    it("creates valid statuses", () => {
      expect(TableStatus.create("available").value).toBe("available");
      expect(TableStatus.create("occupied").value).toBe("occupied");
      expect(TableStatus.create("reserved").value).toBe("reserved");
      expect(TableStatus.create("cleaning").value).toBe("cleaning");
      expect(TableStatus.create("out_of_service").value).toBe("out_of_service");
      expect(TableStatus.create("blocked").value).toBe("blocked");
      expect(TableStatus.create("maintenance").value).toBe("maintenance");
      expect(TableStatus.create("archived").value).toBe("archived");
    });

    it("normalizes whitespace and case", () => {
      expect(TableStatus.create("  OCCUPIED  ").value).toBe("occupied");
      expect(TableStatus.create("Out Of Service").value).toBe("out_of_service");
    });

    it("throws for invalid status", () => {
      expect(() => TableStatus.create("invalid")).toThrow();
      expect(() => TableStatus.create("")).toThrow();
      expect(() => TableStatus.create("deleted")).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const status = TableStatus.reconstitute("archived");
      expect(status.value).toBe("archived");
    });
  });

  describe("equals", () => {
    it("returns true for same status", () => {
      expect(TableStatus.create("available").equals(TableStatus.create("available"))).toBe(true);
    });

    it("returns false for different status", () => {
      expect(TableStatus.create("available").equals(TableStatus.create("occupied"))).toBe(false);
    });
  });

  describe("isTransitionValid", () => {
    it("allows valid transitions", () => {
      expect(TableStatus.create("available").isTransitionValid("reserved")).toBe(true);
      expect(TableStatus.create("available").isTransitionValid("occupied")).toBe(true);
      expect(TableStatus.create("available").isTransitionValid("blocked")).toBe(true);
      expect(TableStatus.create("available").isTransitionValid("maintenance")).toBe(true);
      expect(TableStatus.create("available").isTransitionValid("cleaning")).toBe(true);
      expect(TableStatus.create("reserved").isTransitionValid("occupied")).toBe(true);
      expect(TableStatus.create("reserved").isTransitionValid("available")).toBe(true);
      expect(TableStatus.create("reserved").isTransitionValid("blocked")).toBe(true);
      expect(TableStatus.create("occupied").isTransitionValid("cleaning")).toBe(true);
      expect(TableStatus.create("occupied").isTransitionValid("blocked")).toBe(true);
      expect(TableStatus.create("cleaning").isTransitionValid("available")).toBe(true);
      expect(TableStatus.create("maintenance").isTransitionValid("available")).toBe(true);
      expect(TableStatus.create("blocked").isTransitionValid("available")).toBe(true);
      expect(TableStatus.create("out_of_service").isTransitionValid("available")).toBe(true);
      expect(TableStatus.create("out_of_service").isTransitionValid("maintenance")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(TableStatus.create("available").isTransitionValid("archived")).toBe(false);
      expect(TableStatus.create("occupied").isTransitionValid("reserved")).toBe(false);
      expect(TableStatus.create("occupied").isTransitionValid("available")).toBe(false);
      expect(TableStatus.create("reserved").isTransitionValid("cleaning")).toBe(false);
      expect(TableStatus.create("reserved").isTransitionValid("maintenance")).toBe(false);
      expect(TableStatus.create("cleaning").isTransitionValid("occupied")).toBe(false);
      expect(TableStatus.create("cleaning").isTransitionValid("blocked")).toBe(false);
      expect(TableStatus.create("cleaning").isTransitionValid("maintenance")).toBe(false);
      expect(TableStatus.create("cleaning").isTransitionValid("reserved")).toBe(false);
      expect(TableStatus.create("maintenance").isTransitionValid("occupied")).toBe(false);
      expect(TableStatus.create("maintenance").isTransitionValid("blocked")).toBe(false);
      expect(TableStatus.create("blocked").isTransitionValid("occupied")).toBe(false);
      expect(TableStatus.create("archived").isTransitionValid("available")).toBe(false);
    });
  });

  describe("getAllowedTransitions", () => {
    it("returns correct transitions for available", () => {
      expect(TableStatus.create("available").getAllowedTransitions()).toEqual([
        "reserved", "occupied", "blocked", "maintenance", "cleaning",
      ]);
    });

    it("returns empty array for archived", () => {
      expect(TableStatus.create("archived").getAllowedTransitions()).toEqual([]);
    });
  });

  describe("isTerminal", () => {
    it("returns true for archived", () => {
      expect(TableStatus.create("archived").isTerminal()).toBe(true);
    });

    it("returns false for non-terminal states", () => {
      expect(TableStatus.create("available").isTerminal()).toBe(false);
      expect(TableStatus.create("occupied").isTerminal()).toBe(false);
    });
  });

  describe("isServiceable", () => {
    it("returns false for archived", () => {
      expect(TableStatus.create("archived").isServiceable()).toBe(false);
    });

    it("returns true for active states", () => {
      expect(TableStatus.create("available").isServiceable()).toBe(true);
      expect(TableStatus.create("occupied").isServiceable()).toBe(true);
    });
  });

  describe("helper methods", () => {
    it("isAvailable", () => {
      expect(TableStatus.create("available").isAvailable()).toBe(true);
      expect(TableStatus.create("occupied").isAvailable()).toBe(false);
    });

    it("isOccupied", () => {
      expect(TableStatus.create("occupied").isOccupied()).toBe(true);
      expect(TableStatus.create("available").isOccupied()).toBe(false);
    });

    it("isReserved", () => {
      expect(TableStatus.create("reserved").isReserved()).toBe(true);
      expect(TableStatus.create("available").isReserved()).toBe(false);
    });
  });

  describe("static constants", () => {
    it("has all status constants", () => {
      expect(TableStatus.AVAILABLE).toBe("available");
      expect(TableStatus.ARCHIVED).toBe("archived");
    });
  });
});
