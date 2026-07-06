import { describe, it, expect } from "vitest";
import {
  validateRolePermissionAssignment,
  validateDuplicateAssignment,
  validatePermissionsExist,
  canModifySystemRole,
  validateBulkAssignment,
} from "./RolePermissionValidation.js";

describe("RolePermissionValidation", () => {
  describe("validateRolePermissionAssignment", () => {
    it("returns empty errors for a non-system role", () => {
      const errors = validateRolePermissionAssignment(false, true);
      expect(errors).toHaveLength(0);
    });

    it("returns error for non-deletable system role", () => {
      const errors = validateRolePermissionAssignment(true, false);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("role");
    });

    it("returns empty for system role that is deletable", () => {
      const errors = validateRolePermissionAssignment(true, true);
      expect(errors).toHaveLength(0);
    });
  });

  describe("validateDuplicateAssignment", () => {
    it("returns error when assignment exists", () => {
      const error = validateDuplicateAssignment({ id: "rp-1" });
      expect(error).not.toBeNull();
      expect(error!.field).toBe("assignment");
    });

    it("returns null when no existing assignment", () => {
      const error = validateDuplicateAssignment(null);
      expect(error).toBeNull();
    });

    it("returns null when undefined", () => {
      const error = validateDuplicateAssignment(undefined);
      expect(error).toBeNull();
    });
  });

  describe("validatePermissionsExist", () => {
    it("returns empty array when all found", () => {
      const notFound = validatePermissionsExist(
        ["perm-1", "perm-2"],
        ["perm-1", "perm-2", "perm-3"]
      );
      expect(notFound).toHaveLength(0);
    });

    it("returns missing permission IDs", () => {
      const notFound = validatePermissionsExist(
        ["perm-1", "perm-2", "perm-3"],
        ["perm-1"]
      );
      expect(notFound).toEqual(["perm-2", "perm-3"]);
    });

    it("returns all when none found", () => {
      const notFound = validatePermissionsExist(
        ["perm-1", "perm-2"],
        []
      );
      expect(notFound).toEqual(["perm-1", "perm-2"]);
    });
  });

  describe("canModifySystemRole", () => {
    it("returns true for non-system role", () => {
      expect(canModifySystemRole(false)).toBe(true);
    });

    it("returns false for system role", () => {
      expect(canModifySystemRole(true)).toBe(false);
    });
  });

  describe("validateBulkAssignment", () => {
    const existingIds = ["perm-1", "perm-2"];

    it("returns valid for new assignments", () => {
      const result = validateBulkAssignment("role-1", ["perm-3", "perm-4"], existingIds);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.newAssignments).toEqual(["perm-3", "perm-4"]);
    });

    it("rejects empty roleId", () => {
      const result = validateBulkAssignment("", ["perm-3"], existingIds);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe("roleId");
    });

    it("rejects empty permissionIds", () => {
      const result = validateBulkAssignment("role-1", [], existingIds);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe("permissionIds");
    });

    it("filters out existing assignments from newAssignments", () => {
      const result = validateBulkAssignment(
        "role-1",
        ["perm-1", "perm-3", "perm-2", "perm-4"],
        existingIds
      );
      expect(result.newAssignments).toEqual(["perm-3", "perm-4"]);
    });
  });
});
