import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheInvalidationServiceImpl } from "./CacheInvalidationServiceImpl.js";
import { CacheKeyFactoryImpl } from "./CacheKeyFactoryImpl.js";
import { MemoryCacheProvider } from "./MemoryCacheProvider.js";

describe("CacheInvalidationServiceImpl", () => {
  let cache: MemoryCacheProvider;
  let keyFactory: CacheKeyFactoryImpl;
  let invalidation: CacheInvalidationServiceImpl;

  beforeEach(() => {
    cache = new MemoryCacheProvider({ defaultTtlMs: 0 });
    keyFactory = new CacheKeyFactoryImpl();
    invalidation = new CacheInvalidationServiceImpl(cache, keyFactory);
  });

  describe("invalidateUser", () => {
    it("clears all cache entries for a user", async () => {
      await cache.set(keyFactory.userPermissions("user-1", "restaurant-1"), "data1");
      await cache.set(keyFactory.userRoles("user-1", "restaurant-1"), "data2");
      await cache.set(keyFactory.userPermissions("user-1", "restaurant-2"), "data3");
      await cache.set(keyFactory.userPermissions("user-2", "restaurant-1"), "data4");

      await invalidation.invalidateUser("user-1");

      expect(await cache.get("permissions:user:user-1:restaurant-1")).toBeUndefined();
      expect(await cache.get("roles:user:user-1:restaurant-1")).toBeUndefined();
      expect(await cache.get("permissions:user:user-1:restaurant-2")).toBeUndefined();
      expect(await cache.get(keyFactory.userPermissions("user-2", "restaurant-1"))).toBe("data4");
    });

    it("does nothing when user has no cache entries", async () => {
      await expect(invalidation.invalidateUser("nonexistent")).resolves.toBeUndefined();
    });
  });

  describe("invalidateUserForRestaurant", () => {
    it("clears permissions and roles for user in specific restaurant", async () => {
      await cache.set(keyFactory.userPermissions("user-1", "restaurant-1"), "data1");
      await cache.set(keyFactory.userRoles("user-1", "restaurant-1"), "data2");
      await cache.set(keyFactory.userPermissions("user-1", "restaurant-2"), "data3");

      await invalidation.invalidateUserForRestaurant("user-1", "restaurant-1");

      expect(await cache.get(keyFactory.userPermissions("user-1", "restaurant-1"))).toBeUndefined();
      expect(await cache.get(keyFactory.userRoles("user-1", "restaurant-1"))).toBeUndefined();
      expect(await cache.get(keyFactory.userPermissions("user-1", "restaurant-2"))).toBe("data3");
    });

    it("does nothing when no entries exist", async () => {
      await expect(
        invalidation.invalidateUserForRestaurant("user-1", "restaurant-1")
      ).resolves.toBeUndefined();
    });
  });

  describe("invalidateRestaurant", () => {
    it("clears all cache entries for a restaurant", async () => {
      await cache.set(keyFactory.userPermissions("user-1", "restaurant-1"), "data1");
      await cache.set(keyFactory.userPermissions("user-2", "restaurant-1"), "data2");
      await cache.set(keyFactory.userPermissions("user-1", "restaurant-2"), "data3");

      await invalidation.invalidateRestaurant("restaurant-1");

      expect(await cache.get(keyFactory.userPermissions("user-1", "restaurant-1"))).toBeUndefined();
      expect(await cache.get(keyFactory.userPermissions("user-2", "restaurant-1"))).toBeUndefined();
      expect(await cache.get(keyFactory.userPermissions("user-1", "restaurant-2"))).toBe("data3");
    });
  });

  describe("invalidateAll", () => {
    it("clears the entire cache", async () => {
      await cache.set("key1", "v1");
      await cache.set("key2", "v2");

      await invalidation.invalidateAll();

      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe("integration: PermissionResolutionServiceImpl cache flow", () => {
    it("permissions are cached and invalidated correctly", async () => {
      const permKey = keyFactory.userPermissions("user-1", "restaurant-1");
      const mockPermissions = {
        userId: "user-1",
        restaurantId: "restaurant-1",
        permissions: new Set(["orders.read"]) as ReadonlySet<string>,
        permissionCodes: Object.freeze(["orders.read"]),
        roleIds: Object.freeze(["role-1"]),
        roleCodes: Object.freeze(["waiter"]),
        resolvedAt: new Date(),
      };

      await cache.set(permKey, mockPermissions, 300_000);

      const cached = await cache.get(permKey);
      expect(cached).toBeDefined();
      expect((cached as typeof mockPermissions).permissionCodes).toContain("orders.read");

      await invalidation.invalidateUserForRestaurant("user-1", "restaurant-1");

      expect(await cache.get(permKey)).toBeUndefined();
    });
  });
});
