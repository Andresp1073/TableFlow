import { describe, it, expect } from "vitest";
import {
  validateUserRoleAssignment,
  validateDuplicateUserRole,
  validateRestaurantContext,
  validateCrossTenantAssignment,
  validateSystemRoleAssignment,
  validateUserRoleUpdate,
  validateRoleRemoval,
} from "./UserRoleValidation.js";

const activeRole = {
  id: "role-1",
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

const inactiveRole = {
  ...activeRole,
  id: "role-2",
  code: "inactive-role",
  status: "inactive",
};

const systemRole = {
  ...activeRole,
  id: "role-3",
  code: "super-admin",
  restaurantId: null,
  isSystem: true,
};

const activeAssignment = {
  id: "ua-1",
  userId: "user-1",
  roleId: "role-1",
  restaurantId: "restaurant-1",
  branchId: null,
  assignedBy: "admin-1",
  assignedAt: new Date(),
  expiresAt: null,
  status: "active" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const revokedAssignment = {
  ...activeAssignment,
  id: "ua-2",
  status: "revoked" as const,
};

describe("UserRoleValidation", () => {
  describe("validateUserRoleAssignment", () => {
    it("returns empty errors for a valid assignment", () => {
      const errors = validateUserRoleAssignment(activeRole, "restaurant-1");
      expect(errors).toHaveLength(0);
    });

    it("returns error when role is null", () => {
      const errors = validateUserRoleAssignment(null, "restaurant-1");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("roleId");
    });

    it("returns error for inactive role", () => {
      const errors = validateUserRoleAssignment(inactiveRole, "restaurant-1");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("roleId");
      expect(errors[0].message).toContain("inactive");
    });

    it("returns error when role belongs to different restaurant", () => {
      const errors = validateUserRoleAssignment(activeRole, "restaurant-2");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("restaurantId");
    });
  });

  describe("validateDuplicateUserRole", () => {
    it("returns error when active assignment exists", () => {
      const error = validateDuplicateUserRole(activeAssignment);
      expect(error).not.toBeNull();
      expect(error!.field).toBe("assignment");
    });

    it("returns null when only revoked assignment exists", () => {
      const error = validateDuplicateUserRole(revokedAssignment);
      expect(error).toBeNull();
    });

    it("returns null when no existing assignment", () => {
      const error = validateDuplicateUserRole(null);
      expect(error).toBeNull();
    });
  });

  describe("validateRestaurantContext", () => {
    it("returns null when user belongs to target restaurant", () => {
      const error = validateRestaurantContext("user-1", "restaurant-1", "restaurant-1");
      expect(error).toBeNull();
    });

    it("returns error when user has no organization", () => {
      const error = validateRestaurantContext("user-1", null, "restaurant-1");
      expect(error).not.toBeNull();
      expect(error!.field).toBe("userId");
    });

    it("returns error when user belongs to different restaurant", () => {
      const error = validateRestaurantContext("user-1", "restaurant-2", "restaurant-1");
      expect(error).not.toBeNull();
      expect(error!.field).toBe("restaurantId");
    });
  });

  describe("validateCrossTenantAssignment", () => {
    it("allows system role assignment by system admin", () => {
      const error = validateCrossTenantAssignment(null, "restaurant-1", true);
      expect(error).toBeNull();
    });

    it("rejects system role assignment by non-system admin", () => {
      const error = validateCrossTenantAssignment(null, "restaurant-1", false);
      expect(error).not.toBeNull();
      expect(error!.field).toBe("roleId");
    });

    it("rejects role from different restaurant", () => {
      const error = validateCrossTenantAssignment("restaurant-2", "restaurant-1", false);
      expect(error).not.toBeNull();
      expect(error!.field).toBe("roleId");
    });

    it("allows matching restaurant role", () => {
      const error = validateCrossTenantAssignment("restaurant-1", "restaurant-1", false);
      expect(error).toBeNull();
    });
  });

  describe("validateSystemRoleAssignment", () => {
    it("allows system role assignment with elevated permissions", () => {
      const error = validateSystemRoleAssignment(systemRole, true);
      expect(error).toBeNull();
    });

    it("rejects system role assignment without elevated permissions", () => {
      const error = validateSystemRoleAssignment(systemRole, false);
      expect(error).not.toBeNull();
      expect(error!.field).toBe("roleId");
    });

    it("allows non-system role assignment regardless of permissions", () => {
      const error = validateSystemRoleAssignment(activeRole, false);
      expect(error).toBeNull();
    });
  });

  describe("validateUserRoleUpdate", () => {
    it("returns empty errors for valid status update", () => {
      const errors = validateUserRoleUpdate("active", "expired");
      expect(errors).toHaveLength(0);
    });

    it("returns error for invalid status value", () => {
      const errors = validateUserRoleUpdate("active", "invalid");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("status");
    });

    it("returns error when modifying revoked assignment", () => {
      const errors = validateUserRoleUpdate("revoked", "active");
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("revoked");
    });

    it("returns error when modifying expired to non-active", () => {
      const errors = validateUserRoleUpdate("expired", "revoked");
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("reactivated");
    });

    it("allows expired to active transition", () => {
      const errors = validateUserRoleUpdate("expired", "active");
      expect(errors).toHaveLength(0);
    });
  });

  describe("validateRoleRemoval", () => {
    it("returns error when no existing assignment", () => {
      const errors = validateRoleRemoval(activeRole, null, false);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("assignment");
    });

    it("returns empty errors for valid removal", () => {
      const errors = validateRoleRemoval(activeRole, activeAssignment, false);
      expect(errors).toHaveLength(0);
    });

    it("returns error for system role removal without admin", () => {
      const errors = validateRoleRemoval(systemRole, activeAssignment, false);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("roleId");
    });

    it("allows system role removal with admin", () => {
      const errors = validateRoleRemoval(systemRole, activeAssignment, true);
      expect(errors).toHaveLength(0);
    });
  });
});
