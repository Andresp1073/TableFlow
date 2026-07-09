import { describe, it, expect, vi, beforeEach } from "vitest";
import { PermissionResolutionServiceImpl } from "../../../modules/authorization/infrastructure/services/PermissionResolutionServiceImpl.js";
import { MemoryCacheProvider } from "./MemoryCacheProvider.js";
import { CacheKeyFactoryImpl } from "./CacheKeyFactoryImpl.js";
import { CacheInvalidationServiceImpl } from "./CacheInvalidationServiceImpl.js";
import type { PermissionResolutionContext } from "../../../modules/authorization/domain/models/PermissionResolution.js";

function createMockDb() {
  const defaultUser = { id: "user-1", email: "test@example.com", isActive: true };

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

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(defaultUser),
    },
    userRole: {
      findMany: vi.fn().mockResolvedValue([
        {
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
        },
      ]),
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

describe("PermissionResolutionServiceImpl with cache", () => {
  let service: PermissionResolutionServiceImpl;
  let cache: MemoryCacheProvider;
  let keyFactory: CacheKeyFactoryImpl;
  let invalidation: CacheInvalidationServiceImpl;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
    cache = new MemoryCacheProvider({ defaultTtlMs: 300_000 });
    keyFactory = new CacheKeyFactoryImpl();
    invalidation = new CacheInvalidationServiceImpl(cache, keyFactory);
    service = new PermissionResolutionServiceImpl(mockDb as never, cache, keyFactory, invalidation);
  });

  it("caches permission resolution results", async () => {
    const ctx = makeContext();
    const cacheKey = keyFactory.userPermissions(ctx.userId, ctx.restaurantId);

    expect(await cache.get(cacheKey)).toBeUndefined();

    const result1 = await service.resolve(ctx);

    expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);

    const cached = await cache.get(cacheKey);
    expect(cached).toBeDefined();

    const result2 = await service.resolve(ctx);

    expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);

    expect(result1.permissionCodes).toEqual(result2.permissionCodes);
  });

  it("returns fresh data after cache invalidation", async () => {
    const ctx = makeContext();
    const cacheKey = keyFactory.userPermissions(ctx.userId, ctx.restaurantId);

    await service.resolve(ctx);
    const cached = await cache.get(cacheKey);
    expect(cached).toBeDefined();

    await invalidation.invalidateUserForRestaurant(ctx.userId, ctx.restaurantId);
    expect(await cache.get(cacheKey)).toBeUndefined();

    mockDb.userRole.findMany.mockClear();
    await service.resolve(ctx);
    expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);
  });

  it("respects request-level WeakMap cache alongside provider cache", async () => {
    const ctx = makeContext();
    const reqKey = {};

    await service.resolve(ctx, reqKey);
    expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);

    await service.resolve(ctx, reqKey);
    expect(mockDb.userRole.findMany).toHaveBeenCalledTimes(1);

    mockDb.userRole.findMany.mockClear();

    const result = await service.resolve(ctx);
    expect(result).toBeDefined();
  });

  it("caches with shorter TTL for empty permissions", async () => {
    mockDb.userRole.findMany.mockResolvedValue([]);
    const ctx = makeContext();
    const cacheKey = keyFactory.userPermissions(ctx.userId, ctx.restaurantId);

    await service.resolve(ctx);

    const entry = await cache.get(cacheKey);
    expect(entry).toBeDefined();
    expect((entry as { permissionCodes: readonly string[] }).permissionCodes).toHaveLength(0);
  });

  it("maintains acceptable hit rate over repeated resolves", async () => {
    const ctx = makeContext();

    await service.resolve(ctx);

    for (let i = 0; i < 10; i++) {
      await service.resolve(ctx);
    }

    const stats = cache.getStats();
    expect(stats.hitRate).toBeGreaterThan(0.8);
  });
});
