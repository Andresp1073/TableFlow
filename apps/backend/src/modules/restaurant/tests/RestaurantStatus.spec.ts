import { describe, it, expect } from "vitest";
import { RestaurantStatus, RESTAURANT_STATUSES } from "../domain/models/RestaurantStatus.js";

describe("RestaurantStatus", () => {
  describe("create", () => {
    it("creates a valid status", () => {
      expect(RestaurantStatus.create("active").value).toBe("active");
      expect(RestaurantStatus.create("draft").value).toBe("draft");
      expect(RestaurantStatus.create("pending").value).toBe("pending");
      expect(RestaurantStatus.create("suspended").value).toBe("suspended");
      expect(RestaurantStatus.create("inactive").value).toBe("inactive");
      expect(RestaurantStatus.create("archived").value).toBe("archived");
    });

    it("normalizes whitespace and case", () => {
      const status = RestaurantStatus.create("  ACTIVE  ");
      expect(status.value).toBe("active");
    });

    it("throws for invalid status", () => {
      expect(() => RestaurantStatus.create("deleted")).toThrow(
        'Invalid restaurant status "deleted"'
      );

      expect(() => RestaurantStatus.create("closing_down")).toThrow(
        'Invalid restaurant status "closing_down"'
      );
    });

    it("throws for empty string", () => {
      expect(() => RestaurantStatus.create("")).toThrow(/Invalid restaurant status/);
    });
  });

  describe("reconstitute", () => {
    it("creates status without validation", () => {
      const status = RestaurantStatus.reconstitute("draft");
      expect(status.value).toBe("draft");
    });
  });

  describe("static factories", () => {
    it("draft() returns draft", () => {
      expect(RestaurantStatus.draft().value).toBe("draft");
    });

    it("pending() returns pending", () => {
      expect(RestaurantStatus.pending().value).toBe("pending");
    });

    it("active() returns active", () => {
      expect(RestaurantStatus.active().value).toBe("active");
    });

    it("suspended() returns suspended", () => {
      expect(RestaurantStatus.suspended().value).toBe("suspended");
    });

    it("inactive() returns inactive", () => {
      expect(RestaurantStatus.inactive().value).toBe("inactive");
    });

    it("archived() returns archived", () => {
      expect(RestaurantStatus.archived().value).toBe("archived");
    });
  });

  describe("status query methods", () => {
    it("isDraft", () => {
      expect(RestaurantStatus.create("draft").isDraft()).toBe(true);
      expect(RestaurantStatus.create("active").isDraft()).toBe(false);
    });

    it("isPending", () => {
      expect(RestaurantStatus.create("pending").isPending()).toBe(true);
      expect(RestaurantStatus.create("active").isPending()).toBe(false);
    });

    it("isActive", () => {
      expect(RestaurantStatus.create("active").isActive()).toBe(true);
      expect(RestaurantStatus.create("inactive").isActive()).toBe(false);
    });

    it("isSuspended", () => {
      expect(RestaurantStatus.create("suspended").isSuspended()).toBe(true);
      expect(RestaurantStatus.create("active").isSuspended()).toBe(false);
    });

    it("isInactive", () => {
      expect(RestaurantStatus.create("inactive").isInactive()).toBe(true);
      expect(RestaurantStatus.create("active").isInactive()).toBe(false);
    });

    it("isArchived", () => {
      expect(RestaurantStatus.create("archived").isArchived()).toBe(true);
      expect(RestaurantStatus.create("active").isArchived()).toBe(false);
    });

    it("isTerminal returns true only for archived", () => {
      expect(RestaurantStatus.create("archived").isTerminal()).toBe(true);
      expect(RestaurantStatus.create("draft").isTerminal()).toBe(false);
      expect(RestaurantStatus.create("active").isTerminal()).toBe(false);
    });
  });

  describe("canTransitionTo — state machine transitions", () => {
    it("draft → pending, archived", () => {
      const draft = RestaurantStatus.create("draft");
      expect(draft.canTransitionTo("pending")).toBe(true);
      expect(draft.canTransitionTo("archived")).toBe(true);
      expect(draft.canTransitionTo("active")).toBe(false);
      expect(draft.canTransitionTo("suspended")).toBe(false);
      expect(draft.canTransitionTo("inactive")).toBe(false);
    });

    it("pending → active, draft", () => {
      const pending = RestaurantStatus.create("pending");
      expect(pending.canTransitionTo("active")).toBe(true);
      expect(pending.canTransitionTo("draft")).toBe(true);
      expect(pending.canTransitionTo("archived")).toBe(false);
    });

    it("active → suspended, inactive", () => {
      const active = RestaurantStatus.create("active");
      expect(active.canTransitionTo("suspended")).toBe(true);
      expect(active.canTransitionTo("inactive")).toBe(true);
      expect(active.canTransitionTo("draft")).toBe(false);
      expect(active.canTransitionTo("archived")).toBe(false);
    });

    it("suspended → active, inactive", () => {
      const suspended = RestaurantStatus.create("suspended");
      expect(suspended.canTransitionTo("active")).toBe(true);
      expect(suspended.canTransitionTo("inactive")).toBe(true);
      expect(suspended.canTransitionTo("draft")).toBe(false);
    });

    it("inactive → active, archived", () => {
      const inactive = RestaurantStatus.create("inactive");
      expect(inactive.canTransitionTo("active")).toBe(true);
      expect(inactive.canTransitionTo("archived")).toBe(true);
      expect(inactive.canTransitionTo("suspended")).toBe(false);
    });

    it("archived → (no transitions)", () => {
      const archived = RestaurantStatus.create("archived");
      expect(archived.canTransitionTo("draft")).toBe(false);
      expect(archived.canTransitionTo("pending")).toBe(false);
      expect(archived.canTransitionTo("active")).toBe(false);
      expect(archived.canTransitionTo("suspended")).toBe(false);
      expect(archived.canTransitionTo("inactive")).toBe(false);
      expect(archived.allowedTransitions()).toEqual([]);
    });
  });

  describe("allowedTransitions", () => {
    it("returns correct transitions for each status", () => {
      expect(RestaurantStatus.create("draft").allowedTransitions()).toEqual(["pending", "archived"]);
      expect(RestaurantStatus.create("pending").allowedTransitions()).toEqual(["active", "draft"]);
      expect(RestaurantStatus.create("active").allowedTransitions()).toEqual(["suspended", "inactive"]);
      expect(RestaurantStatus.create("suspended").allowedTransitions()).toEqual(["active", "inactive"]);
      expect(RestaurantStatus.create("inactive").allowedTransitions()).toEqual(["active", "archived"]);
      expect(RestaurantStatus.create("archived").allowedTransitions()).toEqual([]);
    });
  });

  describe("equals", () => {
    it("returns true for same value", () => {
      const a = RestaurantStatus.create("draft");
      const b = RestaurantStatus.create("draft");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different values", () => {
      const a = RestaurantStatus.create("draft");
      const b = RestaurantStatus.create("pending");
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("RESTAURANT_STATUSES", () => {
    it("contains all expected statuses", () => {
      expect(RESTAURANT_STATUSES).toEqual([
        "draft",
        "pending",
        "active",
        "suspended",
        "inactive",
        "archived",
      ]);
    });
  });
});
