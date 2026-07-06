import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleAssignmentServiceImpl } from "./RoleAssignmentServiceImpl.js";

function createMockUserRoleRepo() {
  return {
    findById: vi.fn(),
    findByUserAndRole: vi.fn(),
    findByUser: vi.fn(),
    findByRole: vi.fn(),
    findByRestaurant: vi.fn(),
    findByUserAndRestaurant: vi.fn(),
    findByRestaurantAndRole: vi.fn(),
    findUsersByRole: vi.fn(),
    findActiveByUser: vi.fn(),
    findExpired: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updateExpiresAt: vi.fn(),
    delete: vi.fn(),
    deleteByUserAndRole: vi.fn(),
  };
}

function createMockRoleRepo() {
  return {
    findById: vi.fn(),
    findByCode: vi.fn(),
    findByCodeAndRestaurant: vi.fn(),
    findAll: vi.fn(),
    findSystemRoles: vi.fn(),
    findDefaultRoles: vi.fn(),
    findRolesByRestaurant: vi.fn(),
    findRolesByUser: vi.fn(),
  };
}

const mockUser = {
  id: "user-1",
  organizationId: "restaurant-1",
  email: "test@example.com",
  isActive: true,
};

const mockAdmin = {
  id: "admin-1",
  organizationId: "restaurant-1",
  email: "admin@example.com",
  isActive: true,
};

const mockRole = {
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

const mockAssignment = {
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

describe("RoleAssignmentServiceImpl", () => {
  let service: RoleAssignmentServiceImpl;
  let mockUserRoleRepo: ReturnType<typeof createMockUserRoleRepo>;
  let mockRoleRepo: ReturnType<typeof createMockRoleRepo>;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRoleRepo = createMockUserRoleRepo();
    mockRoleRepo = createMockRoleRepo();
    mockDb = {
      user: {
        findUnique: vi.fn(),
      },
    };
    service = new RoleAssignmentServiceImpl(
      mockUserRoleRepo as any,
      mockRoleRepo as any,
      mockDb as any
    );
  });

  describe("assignRole", () => {
    it("creates assignment when valid", async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(null);
      mockUserRoleRepo.create.mockResolvedValue(mockAssignment);

      const result = await service.assignRole("user-1", "role-1", "restaurant-1", "admin-1");

      expect(result.assignment).toEqual(mockAssignment);
      expect(mockUserRoleRepo.create).toHaveBeenCalledWith({
        userId: "user-1",
        roleId: "role-1",
        restaurantId: "restaurant-1",
        branchId: null,
        assignedBy: "admin-1",
        expiresAt: null,
      });
    });

    it("throws UserNotFoundError when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignRole("user-unknown", "role-1", "restaurant-1", "admin-1")
      ).rejects.toThrow("User not found");
      expect(mockUserRoleRepo.create).not.toHaveBeenCalled();
    });

    it("throws RoleNotFoundError when role does not exist", async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      mockRoleRepo.findById.mockResolvedValue(null);

      await expect(
        service.assignRole("user-1", "role-unknown", "restaurant-1", "admin-1")
      ).rejects.toThrow("not found");
    });

    it("throws InvalidRoleAssignmentError when role is inactive", async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      mockRoleRepo.findById.mockResolvedValue({ ...mockRole, status: "inactive" });

      await expect(
        service.assignRole("user-1", "role-1", "restaurant-1", "admin-1")
      ).rejects.toThrow("inactive");
    });

    it("throws DuplicateAssignmentError when active assignment exists", async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(mockAssignment);

      await expect(
        service.assignRole("user-1", "role-1", "restaurant-1", "admin-1")
      ).rejects.toThrow("already assigned");
      expect(mockUserRoleRepo.create).not.toHaveBeenCalled();
    });

    it("passes branchId and expiresAt when provided", async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(null);
      mockUserRoleRepo.create.mockResolvedValue(mockAssignment);

      const expiresAt = new Date("2026-12-31");
      await service.assignRole("user-1", "role-1", "restaurant-1", "admin-1", {
        branchId: "branch-1",
        expiresAt,
      });

      expect(mockUserRoleRepo.create).toHaveBeenCalledWith({
        userId: "user-1",
        roleId: "role-1",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        assignedBy: "admin-1",
        expiresAt,
      });
    });
  });

  describe("removeRole", () => {
    it("removes role when assignment exists", async () => {
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(mockAssignment);
      mockUserRoleRepo.deleteByUserAndRole.mockResolvedValue(undefined);

      await service.removeRole("user-1", "role-1", "restaurant-1", "admin-1");

      expect(mockUserRoleRepo.deleteByUserAndRole).toHaveBeenCalledWith(
        "user-1",
        "role-1",
        "restaurant-1"
      );
    });

    it("throws InvalidRoleAssignmentError when no assignment exists", async () => {
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(null);

      await expect(
        service.removeRole("user-1", "role-1", "restaurant-1", "admin-1")
      ).rejects.toThrow("not have this role assigned");
      expect(mockUserRoleRepo.deleteByUserAndRole).not.toHaveBeenCalled();
    });

    it("throws error when role does not exist", async () => {
      mockRoleRepo.findById.mockResolvedValue(null);

      await expect(
        service.removeRole("user-1", "role-unknown", "restaurant-1", "admin-1")
      ).rejects.toThrow("not have this role assigned");
    });
  });

  describe("replaceUserRoles", () => {
    it("replaces all roles for a user in a restaurant", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUserRoleRepo.findByUserAndRestaurant.mockResolvedValue([mockAssignment]);
      mockRoleRepo.findById
        .mockResolvedValueOnce({
          ...mockRole,
          id: "role-2",
          code: "waiter",
        });
      mockUserRoleRepo.create.mockResolvedValue({
        ...mockAssignment,
        id: "ua-2",
        roleId: "role-2",
      });

      const result = await service.replaceUserRoles(
        "user-1",
        "restaurant-1",
        ["role-1", "role-2"],
        "admin-1"
      );

      expect(result.removed).toBe(0); // role-1 is in the new set, so not removed
      expect(result.assigned).toBe(1); // role-2 is new
    });

    it("handles empty current assignments", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUserRoleRepo.findByUserAndRestaurant.mockResolvedValue([]);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.create.mockResolvedValue(mockAssignment);

      const result = await service.replaceUserRoles(
        "user-1",
        "restaurant-1",
        ["role-1"],
        "admin-1"
      );

      expect(result.removed).toBe(0);
      expect(result.assigned).toBe(1);
    });

    it("throws error when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.replaceUserRoles("user-unknown", "restaurant-1", ["role-1"], "admin-1")
      ).rejects.toThrow("User not found");
    });
  });

  describe("getUserRoles", () => {
    it("returns all roles for a user", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUserRoleRepo.findByUser.mockResolvedValue([mockAssignment]);

      const result = await service.getUserRoles("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe("role-1");
    });

    it("filters by restaurant when provided", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUserRoleRepo.findByUserAndRestaurant.mockResolvedValue([mockAssignment]);

      const result = await service.getUserRoles("user-1", "restaurant-1");

      expect(mockUserRoleRepo.findByUserAndRestaurant).toHaveBeenCalledWith(
        "user-1",
        "restaurant-1"
      );
      expect(result).toHaveLength(1);
    });

    it("throws error when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserRoles("user-unknown")
      ).rejects.toThrow("User not found");
    });
  });

  describe("getUsersInRole", () => {
    it("returns all users with a role", async () => {
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByRole.mockResolvedValue([mockAssignment]);

      const result = await service.getUsersInRole("role-1");

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-1");
    });

    it("filters by restaurant when provided", async () => {
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByRestaurantAndRole.mockResolvedValue([mockAssignment]);

      const result = await service.getUsersInRole("role-1", "restaurant-1");

      expect(mockUserRoleRepo.findByRestaurantAndRole).toHaveBeenCalledWith(
        "restaurant-1",
        "role-1"
      );
    });

    it("throws error when role does not exist", async () => {
      mockRoleRepo.findById.mockResolvedValue(null);

      await expect(
        service.getUsersInRole("role-unknown")
      ).rejects.toThrow("not found");
    });
  });

  describe("getRestaurantUsers", () => {
    it("returns users grouped by userId", async () => {
      mockUserRoleRepo.findByRestaurant.mockResolvedValue([
        mockAssignment,
        { ...mockAssignment, id: "ua-2", roleId: "role-2" },
      ]);

      const result = await service.getRestaurantUsers("restaurant-1");

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-1");
      expect(result[0].assignments).toHaveLength(2);
    });

    it("returns empty array when no assignments", async () => {
      mockUserRoleRepo.findByRestaurant.mockResolvedValue([]);

      const result = await service.getRestaurantUsers("restaurant-1");

      expect(result).toHaveLength(0);
    });
  });

  describe("updateAssignmentStatus", () => {
    it("updates status to expired", async () => {
      mockUserRoleRepo.findById.mockResolvedValue(mockAssignment);
      mockUserRoleRepo.updateStatus.mockResolvedValue({
        ...mockAssignment,
        status: "expired",
      });

      const result = await service.updateAssignmentStatus("ua-1", "expired", "admin-1");

      expect(result.status).toBe("expired");
      expect(mockUserRoleRepo.updateStatus).toHaveBeenCalledWith("ua-1", "expired");
    });

    it("throws error when assignment does not exist", async () => {
      mockUserRoleRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateAssignmentStatus("ua-unknown", "expired", "admin-1")
      ).rejects.toThrow("not found");
    });

    it("throws error when modifying revoked assignment", async () => {
      mockUserRoleRepo.findById.mockResolvedValue({
        ...mockAssignment,
        status: "revoked",
      });

      await expect(
        service.updateAssignmentStatus("ua-1", "active", "admin-1")
      ).rejects.toThrow("revoked");
    });
  });

  describe("updateAssignmentExpiry", () => {
    it("updates expiry date", async () => {
      const newExpiry = new Date("2026-12-31");
      mockUserRoleRepo.findById.mockResolvedValue(mockAssignment);
      mockUserRoleRepo.updateExpiresAt.mockResolvedValue({
        ...mockAssignment,
        expiresAt: newExpiry,
      });

      const result = await service.updateAssignmentExpiry("ua-1", newExpiry, "admin-1");

      expect(result.expiresAt).toEqual(newExpiry);
    });

    it("clears expiry date when null", async () => {
      mockUserRoleRepo.findById.mockResolvedValue(mockAssignment);
      mockUserRoleRepo.updateExpiresAt.mockResolvedValue({
        ...mockAssignment,
        expiresAt: null,
      });

      const result = await service.updateAssignmentExpiry("ua-1", null, "admin-1");

      expect(result.expiresAt).toBeNull();
    });

    it("throws error for revoked assignment", async () => {
      mockUserRoleRepo.findById.mockResolvedValue({
        ...mockAssignment,
        status: "revoked",
      });

      await expect(
        service.updateAssignmentExpiry("ua-1", new Date(), "admin-1")
      ).rejects.toThrow("revoked");
    });
  });

  describe("validateAssignment", () => {
    it("returns valid for a valid assignment", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(null);

      const result = await service.validateAssignment("user-1", "role-1", "restaurant-1");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns errors for missing user", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockRoleRepo.findById.mockResolvedValue(mockRole);

      const result = await service.validateAssignment("user-unknown", "role-1", "restaurant-1");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("User"))).toBe(true);
    });

    it("returns errors for missing role", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(null);

      const result = await service.validateAssignment("user-1", "role-unknown", "restaurant-1");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Role"))).toBe(true);
    });

    it("returns errors for duplicate assignment", async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRoleRepo.findByUserAndRole.mockResolvedValue(mockAssignment);

      const result = await service.validateAssignment("user-1", "role-1", "restaurant-1");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("already assigned"))).toBe(true);
    });
  });
});
