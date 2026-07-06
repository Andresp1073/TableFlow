import { describe, it, expect } from "vitest";
import { RoleAssignmentPolicy } from "./RoleAssignmentPolicy.js";

const systemRole = {
  id: "role-1",
  code: "super-admin",
  name: "Super Admin",
  description: null,
  restaurantId: null,
  isSystem: true,
  isDefault: false,
  priority: 1000,
  color: null,
  icon: null,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const restaurantRole = {
  id: "role-2",
  code: "manager",
  name: "Manager",
  description: null,
  restaurantId: "restaurant-1",
  isSystem: false,
  isDefault: false,
  priority: 500,
  color: null,
  icon: null,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("RoleAssignmentPolicy", () => {
  const policy = new RoleAssignmentPolicy();

  describe("canAssignRole", () => {
    it("allows assigning restaurant role with tenant admin role", () => {
      const result = policy.canAssignRole(restaurantRole, false, [
        "restaurant-owner",
      ]);
      expect(result.allowed).toBe(true);
    });

    it("allows assigning system role with system role", () => {
      const result = policy.canAssignRole(systemRole, true, ["super-admin"]);
      expect(result.allowed).toBe(true);
    });

    it("rejects assigning system role without system permissions", () => {
      const result = policy.canAssignRole(systemRole, false, ["manager"]);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("System roles");
    });

    it("rejects assigning restaurant role with insufficient permissions", () => {
      const result = policy.canAssignRole(restaurantRole, false, ["viewer"]);
      expect(result.allowed).toBe(false);
    });
  });

  describe("canRemoveRole", () => {
    it("allows removing restaurant role with tenant admin role", () => {
      const result = policy.canRemoveRole(restaurantRole, false, [
        "restaurant-manager",
      ]);
      expect(result.allowed).toBe(true);
    });

    it("rejects removing system role without system permissions", () => {
      const result = policy.canRemoveRole(systemRole, false, ["manager"]);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("System roles");
    });
  });

  describe("canModifySystemRoles", () => {
    it("returns true for super-admin", () => {
      expect(policy.canModifySystemRoles(["super-admin"])).toBe(true);
    });

    it("returns true for platform-admin", () => {
      expect(policy.canModifySystemRoles(["platform-admin"])).toBe(true);
    });

    it("returns false for restaurant roles", () => {
      expect(policy.canModifySystemRoles(["manager"])).toBe(false);
    });
  });

  describe("isTenantAdmin", () => {
    it("returns true for restaurant-owner", () => {
      expect(policy.isTenantAdmin(["restaurant-owner"])).toBe(true);
    });

    it("returns true for restaurant-manager", () => {
      expect(policy.isTenantAdmin(["restaurant-manager"])).toBe(true);
    });

    it("returns false for non-admin roles", () => {
      expect(policy.isTenantAdmin(["viewer"])).toBe(false);
    });
  });
});
