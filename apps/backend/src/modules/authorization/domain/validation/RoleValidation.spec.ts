import { describe, it, expect } from "vitest";
import {
  validateRoleCode,
  validateRoleName,
  validateRolePriority,
  validateRoleColor,
  validateRoleIcon,
  validateRoleStatus,
  validateSystemRoleDeletion,
  validateDefaultRoleDuplicate,
  validateRestaurantRoleDuplicate,
  validateRole,
} from "./RoleValidation.js";

describe("RoleValidation", () => {
  describe("validateRoleCode", () => {
    it("returns null for a valid code", () => {
      expect(validateRoleCode("super-admin")).toBeNull();
      expect(validateRoleCode("restaurant-manager")).toBeNull();
      expect(validateRoleCode("waiter")).toBeNull();
    });

    it("rejects empty code", () => {
      const result = validateRoleCode("");
      expect(result).toEqual({ field: "code", message: "Role code is required" });
    });

    it("rejects code exceeding 100 characters", () => {
      const result = validateRoleCode("a".repeat(101));
      expect(result?.field).toBe("code");
    });

    it("rejects code with uppercase letters", () => {
      const result = validateRoleCode("Super-Admin");
      expect(result?.field).toBe("code");
    });

    it("rejects code with underscores", () => {
      const result = validateRoleCode("super_admin");
      expect(result?.field).toBe("code");
    });

    it("rejects code with spaces", () => {
      const result = validateRoleCode("super admin");
      expect(result?.field).toBe("code");
    });
  });

  describe("validateRoleName", () => {
    it("returns null for a valid name", () => {
      expect(validateRoleName("Super Admin")).toBeNull();
    });

    it("rejects empty name", () => {
      const result = validateRoleName("");
      expect(result).toEqual({ field: "name", message: "Role name is required" });
    });

    it("rejects name exceeding 100 characters", () => {
      const result = validateRoleName("x".repeat(101));
      expect(result?.field).toBe("name");
    });
  });

  describe("validateRolePriority", () => {
    it("returns null for valid priorities", () => {
      expect(validateRolePriority(0)).toBeNull();
      expect(validateRolePriority(500)).toBeNull();
      expect(validateRolePriority(10000)).toBeNull();
    });

    it("rejects non-integer priority", () => {
      const result = validateRolePriority(1.5);
      expect(result?.field).toBe("priority");
    });

    it("rejects negative priority", () => {
      const result = validateRolePriority(-1);
      expect(result?.field).toBe("priority");
    });

    it("rejects priority above 10000", () => {
      const result = validateRolePriority(10001);
      expect(result?.field).toBe("priority");
    });
  });

  describe("validateRoleColor", () => {
    it("returns null for null color", () => {
      expect(validateRoleColor(null)).toBeNull();
    });

    it("returns null for a valid hex color", () => {
      expect(validateRoleColor("#DC2626")).toBeNull();
    });

    it("rejects invalid hex color", () => {
      const result = validateRoleColor("#GGGGGG");
      expect(result?.field).toBe("color");
    });

    it("rejects hex color without hash", () => {
      const result = validateRoleColor("DC2626");
      expect(result?.field).toBe("color");
    });
  });

  describe("validateRoleIcon", () => {
    it("returns null for null icon", () => {
      expect(validateRoleIcon(null)).toBeNull();
    });

    it("returns null for a valid icon", () => {
      expect(validateRoleIcon("shield-check")).toBeNull();
    });

    it("rejects icon with uppercase", () => {
      const result = validateRoleIcon("Shield-Check");
      expect(result?.field).toBe("icon");
    });
  });

  describe("validateRoleStatus", () => {
    it("returns null for valid statuses", () => {
      expect(validateRoleStatus("active")).toBeNull();
      expect(validateRoleStatus("inactive")).toBeNull();
      expect(validateRoleStatus("archived")).toBeNull();
    });

    it("rejects invalid status", () => {
      const result = validateRoleStatus("deleted");
      expect(result?.field).toBe("status");
    });
  });

  describe("validateSystemRoleDeletion", () => {
    it("returns error for system role code", () => {
      const result = validateSystemRoleDeletion("super-admin");
      expect(result?.field).toBe("code");
      expect(result?.message).toContain("cannot be deleted");
    });

    it("returns null for non-system role code", () => {
      expect(validateSystemRoleDeletion("waiter")).toBeNull();
    });

    it("returns null for a system role code that isn't in the protected set", () => {
      expect(validateSystemRoleDeletion("custom-role")).toBeNull();
    });
  });

  describe("validateDefaultRoleDuplicate", () => {
    it("returns error for duplicate default role code", () => {
      const existing = new Set(["restaurant-owner"]);
      const result = validateDefaultRoleDuplicate("restaurant-owner", true, existing);
      expect(result?.field).toBe("code");
      expect(result?.message).toContain("already exists");
    });

    it("returns null if not a default role", () => {
      const existing = new Set(["restaurant-owner"]);
      expect(validateDefaultRoleDuplicate("custom-role", false, existing)).toBeNull();
    });

    it("returns null if code is not in existing set", () => {
      const existing = new Set(["restaurant-owner"]);
      expect(validateDefaultRoleDuplicate("custom-role", true, existing)).toBeNull();
    });
  });

  describe("validateRestaurantRoleDuplicate", () => {
    it("returns error for duplicate role code in restaurant", () => {
      const existing = new Set(["waiter"]);
      const result = validateRestaurantRoleDuplicate("waiter", "org-1", existing);
      expect(result?.field).toBe("code");
      expect(result?.message).toContain("already exists in this restaurant");
    });

    it("returns null for unique role code in restaurant", () => {
      const existing = new Set(["waiter"]);
      expect(validateRestaurantRoleDuplicate("chef", "org-1", existing)).toBeNull();
    });
  });

  describe("validateRole", () => {
    it("returns empty errors for a valid role", () => {
      const role = {
        code: "custom-role",
        name: "Custom Role",
        priority: 500,
        color: "#DC2626",
        icon: "star",
        status: "active",
      };
      expect(validateRole(role)).toEqual([]);
    });

    it("returns errors for invalid fields", () => {
      const role = {
        code: "",
        name: "",
        priority: -1,
        color: "invalid",
        icon: "",
        status: "deleted",
      };
      const errors = validateRole(role);
      expect(errors.length).toBeGreaterThanOrEqual(5);
    });
  });
});
