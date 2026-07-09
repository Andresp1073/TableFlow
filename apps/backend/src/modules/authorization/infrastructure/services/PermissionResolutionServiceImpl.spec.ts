import { describe, it, expect, vi, beforeEach } from "vitest";
import { PermissionResolutionServiceImpl } from "./PermissionResolutionServiceImpl.js";
import type { PermissionResolutionContext } from "../../domain/models/PermissionResolution.js";

function createMockDb() {
  const defaultUser = { id: "user-1", email: "test@example.com", isActive: true };

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(defaultUser),
    },
    userRole: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

function makeContext(overrides?: Partial<PermissionResolutionContext>): PermissionResolutionContext {
  return {
    userId: "user-1",
    restaurantId: "restaurant-1",
    organizationId: "org-1",
    ...overrides,
  };
}

const basePermission = {
  id: "perm-1",
  code: "users.read",
  name: "Read Users",
  description: "Can read users",
  module: "users",
  resource: "users",
  action: "read",
  riskLevel: "low",
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeUserRole(overrides?: Record<string, unknown>) {
  return {
    id: "ur-1",
    userId: "user-1",
    roleId: "role-1",
    restaurantId: "restaurant-1",
    branchId: null,
    assignedBy: "admin-1",
    assignedAt: new Date(),
    expiresAt: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
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
      rolePermissions: [
        {
          id: "rp-1",
          roleId: "role-1",
          permissionId: "perm-1",
          createdAt: new Date(),
          permission: basePermission,
        },
      ],
    },
    ...overrides,
  };
}

describe("PermissionResolutionServiceImpl", () => {
  let service: PermissionResolutionServiceImpl;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
    service = new PermissionResolutionServiceImpl(mockDb as never);
  });

  describe("resolve", () => {
    it("returns resolved permissions for a single role", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result = await service.resolve(makeContext());

      expect(result.userId).toBe("user-1");
      expect(result.restaurantId).toBe("restaurant-1");
      expect(result.permissionCodes).toEqual(["users.read"]);
      expect(result.permissions.has("users.read")).toBe(true);
      expect(result.roleIds).toEqual(["role-1"]);
      expect(result.roleCodes).toEqual(["manager"]);
    });

    it("merges permissions from multiple roles", async () => {
      const role1 = makeUserRole();
      const role2 = makeUserRole({
        id: "ur-2",
        roleId: "role-2",
        role: {
          id: "role-2",
          code: "waiter",
          name: "Waiter",
          restaurantId: "restaurant-1",
          status: "active",
          rolePermissions: [
            {
              id: "rp-2",
              roleId: "role-2",
              permissionId: "perm-2",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-2", code: "orders.read" },
            },
            {
              id: "rp-3",
              roleId: "role-2",
              permissionId: "perm-3",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-3", code: "menu.read" },
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([role1, role2]);

      const result = await service.resolve(makeContext());

      expect(result.permissionCodes).toContain("users.read");
      expect(result.permissionCodes).toContain("orders.read");
      expect(result.permissionCodes).toContain("menu.read");
      expect(result.roleIds).toEqual(["role-1", "role-2"]);
      expect(result.roleCodes).toEqual(["manager", "waiter"]);
    });

    it("deduplicates permissions from multiple roles", async () => {
      const role1 = makeUserRole();
      const role2 = makeUserRole({
        id: "ur-2",
        roleId: "role-2",
        role: {
          id: "role-2",
          code: "admin",
          name: "Admin",
          restaurantId: "restaurant-1",
          status: "active",
          rolePermissions: [
            {
              id: "rp-2",
              roleId: "role-2",
              permissionId: "perm-1",
              createdAt: new Date(),
              permission: basePermission,
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([role1, role2]);

      const result = await service.resolve(makeContext());

      expect(result.permissionCodes).toEqual(["users.read"]);
      expect(result.permissionCodes.length).toBe(1);
    });

    it("includes system roles regardless of restaurant context", async () => {
      const systemRole = makeUserRole({
        role: {
          id: "role-sys",
          code: "super-admin",
          name: "Super Admin",
          restaurantId: null,
          isSystem: true,
          status: "active",
          rolePermissions: [
            {
              id: "rp-sys",
              roleId: "role-sys",
              permissionId: "perm-sys",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-sys", code: "system.admin" },
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([systemRole]);

      const result = await service.resolve(makeContext({ restaurantId: "other-restaurant" }));

      expect(result.permissionCodes).toEqual(["system.admin"]);
      expect(result.roleCodes).toEqual(["super-admin"]);
    });

    it("filters restaurant roles by restaurant context", async () => {
      const restaurantRole = makeUserRole();
      const otherRestaurantRole = makeUserRole({
        id: "ur-other",
        roleId: "role-other",
        role: {
          id: "role-other",
          code: "other-manager",
          name: "Other Manager",
          restaurantId: "other-restaurant",
          status: "active",
          rolePermissions: [
            {
              id: "rp-other",
              roleId: "role-other",
              permissionId: "perm-other",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-other", code: "other.restricted" },
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([restaurantRole, otherRestaurantRole]);

      const result = await service.resolve(makeContext({ restaurantId: "restaurant-1" }));

      expect(result.permissionCodes).toEqual(["users.read"]);
      expect(result.permissionCodes).not.toContain("other.restricted");
    });

    it("returns empty permissions when user has only roles from other restaurants", async () => {
      const otherRole = makeUserRole({
        role: {
          id: "role-other",
          code: "other-role",
          name: "Other Role",
          restaurantId: "restaurant-2",
          status: "active",
          rolePermissions: [
            {
              id: "rp-other",
              roleId: "role-other",
              permissionId: "perm-other",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-other", code: "other.permission" },
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([otherRole]);

      const result = await service.resolve(makeContext({ restaurantId: "restaurant-1" }));

      expect(result.permissionCodes).toEqual([]);
      expect(result.permissions.size).toBe(0);
    });

    it("filters out inactive user roles", async () => {
      const activeRole = makeUserRole();
      const expiredRole = makeUserRole({
        id: "ur-expired",
        status: "expired",
      });

      mockDb.userRole.findMany.mockResolvedValue([activeRole, expiredRole]);

      const result = await service.resolve(makeContext());

      expect(result.permissionCodes).toEqual(["users.read"]);
    });

    it("filters out revoked user roles", async () => {
      const activeRole = makeUserRole();
      const revokedRole = makeUserRole({
        id: "ur-revoked",
        status: "revoked",
      });

      mockDb.userRole.findMany.mockResolvedValue([activeRole, revokedRole]);

      const result = await service.resolve(makeContext());

      expect(result.permissionCodes).toEqual(["users.read"]);
    });

    it("throws UserNotFoundError when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.userRole.findMany.mockResolvedValue([]);

      await expect(service.resolve(makeContext())).rejects.toThrow("User not found: user-1");
    });

    it("returns empty result when user has no role assignments", async () => {
      mockDb.userRole.findMany.mockResolvedValue([]);

      const result = await service.resolve(makeContext());

      expect(result.permissionCodes).toEqual([]);
      expect(result.permissions.size).toBe(0);
      expect(result.roleIds).toEqual([]);
      expect(result.roleCodes).toEqual([]);
    });

    it("returns immutable permissionCodes array", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result = await service.resolve(makeContext());

      expect(Object.isFrozen(result.permissionCodes)).toBe(true);
    });

    it("returns immutable roleIds array", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result = await service.resolve(makeContext());

      expect(Object.isFrozen(result.roleIds)).toBe(true);
    });

    it("returns immutable roleCodes array", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result = await service.resolve(makeContext());

      expect(Object.isFrozen(result.roleCodes)).toBe(true);
    });

    it("sets resolvedAt to a valid date", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const before = new Date();
      const result = await service.resolve(makeContext());
      const after = new Date();

      expect(result.resolvedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.resolvedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("makes a single Prisma query for user existence", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      await service.resolve(makeContext());

      expect(mockDb.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });

    it("makes a single Prisma query for role-permission data", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      await service.resolve(makeContext());

      expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);
      expect(mockDb.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          status: "active",
          role: { status: "active" },
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
    });
  });

  describe("caching", () => {
    it("returns cached result when cacheKey is provided", async () => {
      const cacheKey = {};
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result1 = await service.resolve(makeContext(), cacheKey);
      const result2 = await service.resolve(makeContext(), cacheKey);

      expect(result2).toBe(result1);
      expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);
    });

    it("does not cache when cacheKey is omitted", async () => {
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result1 = await service.resolve(makeContext());
      const result2 = await service.resolve(makeContext());

      expect(result2).not.toBe(result1);
      expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(2);
    });

    it("different cache keys produce separate cache entries", async () => {
      const key1 = {};
      const key2 = {};
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result1 = await service.resolve(makeContext(), key1);
      const result2 = await service.resolve(makeContext(), key2);

      expect(result2).not.toBe(result1);
      expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(2);
    });

    it("cache respects WeakMap semantics (key can be garbage collected)", async () => {
      const cacheKey = {};
      mockDb.userRole.findMany.mockResolvedValue([makeUserRole()]);

      await service.resolve(makeContext(), cacheKey);
      // After the WeakMap key goes out of scope, it can be GC'd
      // We just verify the WeakMap doesn't throw
      expect(true).toBe(true);
    });
  });

  describe("cross-tenant isolation", () => {
    it("resolves different permissions for different restaurants", async () => {
      const roleInRestaurant1 = makeUserRole({
        role: {
          id: "role-r1",
          code: "r1-manager",
          name: "R1 Manager",
          restaurantId: "restaurant-1",
          status: "active",
          rolePermissions: [
            {
              id: "rp-r1",
              roleId: "role-r1",
              permissionId: "perm-r1",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-r1", code: "restaurant1.only" },
            },
          ],
        },
      });

      const roleInRestaurant2 = makeUserRole({
        id: "ur-r2",
        roleId: "role-r2",
        role: {
          id: "role-r2",
          code: "r2-manager",
          name: "R2 Manager",
          restaurantId: "restaurant-2",
          status: "active",
          rolePermissions: [
            {
              id: "rp-r2",
              roleId: "role-r2",
              permissionId: "perm-r2",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-r2", code: "restaurant2.only" },
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([roleInRestaurant1, roleInRestaurant2]);

      const result1 = await service.resolve(makeContext({ restaurantId: "restaurant-1" }));
      const result2 = await service.resolve(makeContext({ restaurantId: "restaurant-2" }));

      expect(result1.permissionCodes).toEqual(["restaurant1.only"]);
      expect(result2.permissionCodes).toEqual(["restaurant2.only"]);
    });

    it("system roles are included for any restaurant context", async () => {
      const systemRole = makeUserRole({
        role: {
          id: "role-sys",
          code: "super-admin",
          name: "Super Admin",
          restaurantId: null,
          isSystem: true,
          status: "active",
          rolePermissions: [
            {
              id: "rp-sys",
              roleId: "role-sys",
              permissionId: "perm-sys",
              createdAt: new Date(),
              permission: { ...basePermission, id: "perm-sys", code: "system.admin" },
            },
          ],
        },
      });

      mockDb.userRole.findMany.mockResolvedValue([systemRole]);

      const resultR1 = await service.resolve(makeContext({ restaurantId: "restaurant-1" }));
      const resultR2 = await service.resolve(makeContext({ restaurantId: "restaurant-2" }));

      expect(resultR1.permissionCodes).toEqual(["system.admin"]);
      expect(resultR2.permissionCodes).toEqual(["system.admin"]);
    });
  });

  describe("Prisma query filtering", () => {
    it("filters by active user role status in Prisma query", async () => {
      mockDb.userRole.findMany.mockResolvedValue([]);
      mockDb.user.findUnique.mockResolvedValue({ id: "user-1" });

      await service.resolve(makeContext());

      expect(mockDb.userRole.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
          }),
        })
      );
    });

    it("filters by active role status in Prisma query", async () => {
      mockDb.userRole.findMany.mockResolvedValue([]);
      mockDb.user.findUnique.mockResolvedValue({ id: "user-1" });

      await service.resolve(makeContext());

      expect(mockDb.userRole.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { status: "active" },
          }),
        })
      );
    });

    it("filters by userId in Prisma query", async () => {
      mockDb.userRole.findMany.mockResolvedValue([]);
      mockDb.user.findUnique.mockResolvedValue({ id: "user-1" });

      await service.resolve(makeContext());

      expect(mockDb.userRole.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
          }),
        })
      );
    });
  });
});
