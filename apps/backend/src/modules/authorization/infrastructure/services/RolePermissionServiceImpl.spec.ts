import { describe, it, expect, vi, beforeEach } from "vitest";
import { RolePermissionServiceImpl } from "./RolePermissionServiceImpl.js";
import { DuplicateAssignmentError } from "../../errors/DuplicateAssignmentError.js";

function createMockRepo() {
  return {
    findById: vi.fn(),
    findByRoleId: vi.fn(),
    findByPermissionId: vi.fn(),
    findByRoleAndPermission: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteByRoleAndPermission: vi.fn(),
    deleteByRoleId: vi.fn(),
  };
}

const mockAssignment = {
  id: "rp-1",
  roleId: "role-1",
  permissionId: "perm-1",
  createdAt: new Date(),
};

describe("RolePermissionServiceImpl", () => {
  let service: RolePermissionServiceImpl;
  let mockRepo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockRepo();
    service = new RolePermissionServiceImpl(mockRepo as any);
  });

  describe("assignPermissionToRole", () => {
    it("creates assignment when no duplicate exists", async () => {
      mockRepo.findByRoleAndPermission.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockAssignment);

      const result = await service.assignPermissionToRole("role-1", "perm-1");

      expect(result).toEqual(mockAssignment);
      expect(mockRepo.findByRoleAndPermission).toHaveBeenCalledWith(
        "role-1",
        "perm-1"
      );
      expect(mockRepo.create).toHaveBeenCalledWith("role-1", "perm-1");
    });

    it("throws DuplicateAssignmentError when assignment already exists", async () => {
      mockRepo.findByRoleAndPermission.mockResolvedValue(mockAssignment);

      await expect(
        service.assignPermissionToRole("role-1", "perm-1")
      ).rejects.toThrow("This permission is already assigned to the role");

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("assignPermissionsToRole", () => {
    it("assigns new permissions and skips existing ones", async () => {
      mockRepo.findByRoleId.mockResolvedValue([
        { ...mockAssignment, permissionId: "perm-1" },
      ]);
      mockRepo.create
        .mockResolvedValueOnce({
          ...mockAssignment,
          id: "rp-2",
          permissionId: "perm-2",
        })
        .mockResolvedValueOnce({
          ...mockAssignment,
          id: "rp-3",
          permissionId: "perm-3",
        });

      const result = await service.assignPermissionsToRole("role-1", [
        "perm-1",
        "perm-2",
        "perm-3",
      ]);

      expect(result.assigned).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("handles empty permission list", async () => {
      mockRepo.findByRoleId.mockResolvedValue([]);

      const result = await service.assignPermissionsToRole("role-1", []);

      expect(result.assigned).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it("collects errors when create fails", async () => {
      mockRepo.findByRoleId.mockResolvedValue([]);
      mockRepo.create
        .mockResolvedValueOnce(mockAssignment)
        .mockRejectedValueOnce(new Error("DB error"));

      const result = await service.assignPermissionsToRole("role-1", [
        "perm-1",
        "perm-2",
      ]);

      expect(result.assigned).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("perm-2");
    });
  });

  describe("removePermissionFromRole", () => {
    it("deletes assignment by role and permission", async () => {
      mockRepo.deleteByRoleAndPermission.mockResolvedValue(undefined);

      await service.removePermissionFromRole("role-1", "perm-1");

      expect(mockRepo.deleteByRoleAndPermission).toHaveBeenCalledWith(
        "role-1",
        "perm-1"
      );
    });
  });

  describe("removePermissionsFromRole", () => {
    it("removes multiple permissions and returns count", async () => {
      mockRepo.findByRoleAndPermission
        .mockResolvedValueOnce(mockAssignment)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockAssignment,
          id: "rp-2",
          permissionId: "perm-3",
        });
      mockRepo.delete.mockResolvedValue(undefined);

      const count = await service.removePermissionsFromRole("role-1", [
        "perm-1",
        "perm-2",
        "perm-3",
      ]);

      expect(count).toBe(2);
      expect(mockRepo.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe("replaceRolePermissions", () => {
    it("deletes all existing and creates new assignments", async () => {
      mockRepo.deleteByRoleId.mockResolvedValue(undefined);
      mockRepo.create
        .mockResolvedValueOnce({
          ...mockAssignment,
          id: "rp-new-1",
          permissionId: "perm-1",
        })
        .mockResolvedValueOnce({
          ...mockAssignment,
          id: "rp-new-2",
          permissionId: "perm-2",
        });

      const result = await service.replaceRolePermissions("role-1", [
        "perm-1",
        "perm-2",
      ]);

      expect(result).toHaveLength(2);
      expect(mockRepo.deleteByRoleId).toHaveBeenCalledWith("role-1");
      expect(mockRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("getRolePermissions", () => {
    it("returns all permissions for a role", async () => {
      mockRepo.findByRoleId.mockResolvedValue([mockAssignment]);

      const result = await service.getRolePermissions("role-1");

      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe("role-1");
    });
  });

  describe("getPermissionRoles", () => {
    it("returns all roles for a permission", async () => {
      mockRepo.findByPermissionId.mockResolvedValue([mockAssignment]);

      const result = await service.getPermissionRoles("perm-1");

      expect(result).toHaveLength(1);
      expect(result[0].permissionId).toBe("perm-1");
    });
  });

  describe("hasPermission", () => {
    it("returns true when assignment exists", async () => {
      mockRepo.findByRoleAndPermission.mockResolvedValue(mockAssignment);

      const result = await service.hasPermission("role-1", "perm-1");

      expect(result).toBe(true);
    });

    it("returns false when no assignment", async () => {
      mockRepo.findByRoleAndPermission.mockResolvedValue(null);

      const result = await service.hasPermission("role-1", "perm-1");

      expect(result).toBe(false);
    });
  });
});
