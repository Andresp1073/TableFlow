import { describe, it, expect } from "vitest";
import { RestaurantStatusPolicy, ALL_TRANSITIONS } from "../domain/rules/RestaurantStatusPolicy.js";
import { RestaurantStatus } from "../domain/models/RestaurantStatus.js";
import { InvalidRestaurantStateError } from "../errors/InvalidRestaurantStateError.js";

describe("RestaurantStatusPolicy", () => {
  const policy = new RestaurantStatusPolicy();

  describe("assertTransition", () => {
    it("allows valid transitions", () => {
      expect(() => policy.assertTransition(RestaurantStatus.draft(), "pending")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.draft(), "archived")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.pending(), "active")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.pending(), "draft")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.active(), "suspended")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.active(), "inactive")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.suspended(), "active")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.suspended(), "inactive")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.inactive(), "active")).not.toThrow();
      expect(() => policy.assertTransition(RestaurantStatus.inactive(), "archived")).not.toThrow();
    });

    it("rejects same status transition", () => {
      expect(() => policy.assertTransition(RestaurantStatus.active(), "active")).toThrow(
        "already in status"
      );
    });

    it("rejects invalid transitions", () => {
      expect(() => policy.assertTransition(RestaurantStatus.draft(), "active")).toThrow(
        "Cannot transition restaurant from"
      );

      expect(() => policy.assertTransition(RestaurantStatus.active(), "draft")).toThrow(
        "Cannot transition restaurant from"
      );

      expect(() => policy.assertTransition(RestaurantStatus.archived(), "draft")).toThrow(
        "Cannot transition restaurant from"
      );
    });

    it("includes allowed transitions in error message", () => {
      expect(() => policy.assertTransition(RestaurantStatus.active(), "draft")).toThrow(
        "suspended, inactive"
      );
    });

    it("includes '(none)' message for terminal state", () => {
      expect(() => policy.assertTransition(RestaurantStatus.archived(), "draft")).toThrow(
        "(none)"
      );
    });
  });

  describe("assertNotArchived", () => {
    it("passes for non-archived statuses", () => {
      expect(() => policy.assertNotArchived(RestaurantStatus.active())).not.toThrow();
      expect(() => policy.assertNotArchived(RestaurantStatus.draft())).not.toThrow();
      expect(() => policy.assertNotArchived(RestaurantStatus.inactive())).not.toThrow();
    });

    it("throws for archived", () => {
      expect(() => policy.assertNotArchived(RestaurantStatus.archived())).toThrow(
        "Cannot modify an archived restaurant"
      );
    });
  });

  describe("assertCanActivate", () => {
    it("allows activation from pending", () => {
      expect(() => policy.assertCanActivate(RestaurantStatus.pending())).not.toThrow();
    });

    it("allows activation from inactive", () => {
      expect(() => policy.assertCanActivate(RestaurantStatus.inactive())).not.toThrow();
    });

    it("allows activation from draft", () => {
      expect(() => policy.assertCanActivate(RestaurantStatus.draft())).not.toThrow();
    });

    it("rejects activation from active", () => {
      expect(() => policy.assertCanActivate(RestaurantStatus.active())).toThrow(
        "Only draft, pending, or inactive restaurants can be activated"
      );
    });

    it("rejects activation from suspended", () => {
      expect(() => policy.assertCanActivate(RestaurantStatus.suspended())).toThrow(
        "Only draft, pending, or inactive restaurants can be activated"
      );
    });

    it("rejects activation from archived", () => {
      expect(() => policy.assertCanActivate(RestaurantStatus.archived())).toThrow(
        "Only draft, pending, or inactive restaurants can be activated"
      );
    });
  });

  describe("assertCanSuspend", () => {
    it("allows suspension from active", () => {
      expect(() => policy.assertCanSuspend(RestaurantStatus.active())).not.toThrow();
    });

    it("rejects suspension from non-active statuses", () => {
      expect(() => policy.assertCanSuspend(RestaurantStatus.draft())).toThrow(
        "Only active restaurants can be suspended"
      );
      expect(() => policy.assertCanSuspend(RestaurantStatus.pending())).toThrow(
        "Only active restaurants can be suspended"
      );
      expect(() => policy.assertCanSuspend(RestaurantStatus.inactive())).toThrow(
        "Only active restaurants can be suspended"
      );
      expect(() => policy.assertCanSuspend(RestaurantStatus.suspended())).toThrow(
        "Only active restaurants can be suspended"
      );
      expect(() => policy.assertCanSuspend(RestaurantStatus.archived())).toThrow(
        "Only active restaurants can be suspended"
      );
    });
  });

  describe("assertCanArchive", () => {
    it("allows archiving from draft", () => {
      expect(() => policy.assertCanArchive(RestaurantStatus.draft())).not.toThrow();
    });

    it("allows archiving from inactive", () => {
      expect(() => policy.assertCanArchive(RestaurantStatus.inactive())).not.toThrow();
    });

    it("rejects archiving from active", () => {
      expect(() => policy.assertCanArchive(RestaurantStatus.active())).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });

    it("rejects archiving from pending", () => {
      expect(() => policy.assertCanArchive(RestaurantStatus.pending())).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });

    it("rejects archiving from suspended", () => {
      expect(() => policy.assertCanArchive(RestaurantStatus.suspended())).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });

    it("rejects archiving from archived", () => {
      expect(() => policy.assertCanArchive(RestaurantStatus.archived())).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });
  });

  describe("ALL_TRANSITIONS", () => {
    it("defines all 11 valid transitions", () => {
      expect(ALL_TRANSITIONS).toEqual([
        { from: "draft", to: "pending" },
        { from: "draft", to: "active" },
        { from: "draft", to: "archived" },
        { from: "pending", to: "active" },
        { from: "pending", to: "draft" },
        { from: "active", to: "suspended" },
        { from: "active", to: "inactive" },
        { from: "suspended", to: "active" },
        { from: "suspended", to: "inactive" },
        { from: "inactive", to: "active" },
        { from: "inactive", to: "archived" },
      ]);
    });
  });
});
