import { describe, it, expect } from "vitest";
import {
  validatePermissionCode,
  validatePermissionName,
  validatePermissionResourceAction,
  validateModule,
  validateRiskLevel,
  validatePermissionCatalogEntry,
  validatePermissionCatalog,
} from "./PermissionCatalogValidation.js";

describe("PermissionCatalogValidation", () => {
  describe("validatePermissionCode", () => {
    it("returns null for a valid code", () => {
      expect(validatePermissionCode("users.create")).toBeNull();
    });

    it("rejects empty code", () => {
      const result = validatePermissionCode("");
      expect(result).toEqual({ field: "code", message: "Permission code is required" });
    });

    it("rejects code exceeding 150 characters", () => {
      const result = validatePermissionCode("a".repeat(151));
      expect(result?.field).toBe("code");
    });

    it("rejects code with invalid format (no dot)", () => {
      const result = validatePermissionCode("userscreate");
      expect(result?.field).toBe("code");
    });

    it("rejects code with uppercase module", () => {
      const result = validatePermissionCode("Users.create");
      expect(result?.field).toBe("code");
    });

    it("rejects code starting with reserved prefix", () => {
      const result = validatePermissionCode("internal.secret");
      expect(result?.field).toBe("code");
      expect(result?.message).toContain("reserved");
    });
  });

  describe("validatePermissionName", () => {
    it("returns null for a valid name", () => {
      expect(validatePermissionName("Create Users")).toBeNull();
    });

    it("rejects empty name", () => {
      const result = validatePermissionName("");
      expect(result).toEqual({ field: "name", message: "Permission display name is required" });
    });

    it("rejects name exceeding 200 characters", () => {
      const result = validatePermissionName("x".repeat(201));
      expect(result?.field).toBe("name");
    });
  });

  describe("validatePermissionResourceAction", () => {
    it("returns null for valid resource and action", () => {
      expect(validatePermissionResourceAction("users", "create")).toBeNull();
    });

    it("rejects empty resource", () => {
      const result = validatePermissionResourceAction("", "create");
      expect(result).toEqual({ field: "resource", message: "Resource is required" });
    });

    it("rejects empty action", () => {
      const result = validatePermissionResourceAction("users", "");
      expect(result).toEqual({ field: "action", message: "Action is required" });
    });
  });

  describe("validateModule", () => {
    it("returns null for a known module", () => {
      expect(validateModule("users")).toBeNull();
      expect(validateModule("auth")).toBeNull();
      expect(validateModule("system")).toBeNull();
    });

    it("rejects empty module", () => {
      const result = validateModule("");
      expect(result?.field).toBe("module");
    });

    it("rejects unknown module", () => {
      const result = validateModule("unknown");
      expect(result?.field).toBe("module");
      expect(result?.message).toContain("must be one of");
    });
  });

  describe("validateRiskLevel", () => {
    it("returns null for valid risk levels", () => {
      expect(validateRiskLevel("low")).toBeNull();
      expect(validateRiskLevel("medium")).toBeNull();
      expect(validateRiskLevel("high")).toBeNull();
      expect(validateRiskLevel("critical")).toBeNull();
    });

    it("rejects invalid risk level", () => {
      const result = validateRiskLevel("extreme");
      expect(result?.field).toBe("riskLevel");
    });
  });

  describe("validatePermissionCatalogEntry", () => {
    it("returns empty errors for a valid entry", () => {
      const entry = {
        code: "users.create",
        name: "Create Users",
        description: "Create new users",
        module: "users",
        resource: "users",
        action: "create",
        riskLevel: "medium",
      };
      expect(validatePermissionCatalogEntry(entry)).toEqual([]);
    });

    it("returns errors for mismatched code and resource.action", () => {
      const entry = {
        code: "users.create",
        name: "Create Users",
        description: "Create new users",
        module: "users",
        resource: "users",
        action: "delete",
        riskLevel: "medium",
      };
      const errors = validatePermissionCatalogEntry(entry);
      expect(errors.some((e) => e.field === "code")).toBe(true);
    });

    it("returns errors for multiple invalid fields", () => {
      const entry = {
        code: "",
        name: "",
        description: "",
        module: "unknown",
        resource: "",
        action: "",
        riskLevel: "extreme",
      };
      const errors = validatePermissionCatalogEntry(entry);
      expect(errors.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("validatePermissionCatalog", () => {
    it("validates a batch of entries", () => {
      const entries = [
        {
          code: "users.create",
          name: "Create Users",
          description: "",
          module: "users",
          resource: "users",
          action: "create",
          riskLevel: "low",
        },
        {
          code: "",
          name: "",
          description: "",
          module: "",
          resource: "",
          action: "",
          riskLevel: "",
        },
      ];
      const results = validatePermissionCatalog(entries);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual([]);
      expect(results[1].length).toBeGreaterThanOrEqual(4);
    });
  });
});
