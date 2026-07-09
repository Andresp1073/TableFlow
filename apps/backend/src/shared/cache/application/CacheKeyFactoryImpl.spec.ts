import { describe, it, expect } from "vitest";
import { CacheKeyFactoryImpl, CACHE_NAMESPACE } from "./CacheKeyFactoryImpl.js";

describe("CacheKeyFactoryImpl", () => {
  const factory = new CacheKeyFactoryImpl();

  describe("userPermissions", () => {
    it("builds key with namespace and params", () => {
      const key = factory.userPermissions("user-1", "restaurant-1");
      expect(key).toBe(`${CACHE_NAMESPACE}:permissions:user:user-1:restaurant-1`);
    });

    it("produces distinct keys for different users", () => {
      const k1 = factory.userPermissions("user-1", "restaurant-1");
      const k2 = factory.userPermissions("user-2", "restaurant-1");
      expect(k1).not.toBe(k2);
    });

    it("produces distinct keys for different restaurants", () => {
      const k1 = factory.userPermissions("user-1", "restaurant-1");
      const k2 = factory.userPermissions("user-1", "restaurant-2");
      expect(k1).not.toBe(k2);
    });
  });

  describe("userRoles", () => {
    it("builds key with namespace and params", () => {
      const key = factory.userRoles("user-1", "restaurant-1");
      expect(key).toBe(`${CACHE_NAMESPACE}:roles:user:user-1:restaurant-1`);
    });

    it("produces distinct keys for different users", () => {
      const k1 = factory.userRoles("user-1", "restaurant-1");
      const k2 = factory.userRoles("user-2", "restaurant-1");
      expect(k1).not.toBe(k2);
    });
  });

  describe("patterns", () => {
    it("userPermissions pattern matches all restaurants for a user", () => {
      const pattern = factory.patterns.userPermissions("user-1");
      expect(pattern).toBe(`${CACHE_NAMESPACE}:permissions:user:user-1:*`);
    });

    it("userRoles pattern matches all restaurants for a user", () => {
      const pattern = factory.patterns.userRoles("user-1");
      expect(pattern).toBe(`${CACHE_NAMESPACE}:roles:user:user-1:*`);
    });

    it("allUser pattern matches all cache keys for a user", () => {
      const pattern = factory.patterns.allUser("user-1");
      expect(pattern).toBe(`${CACHE_NAMESPACE}:*:user:user-1:*`);
    });

    it("restaurant pattern matches all keys for a restaurant", () => {
      const pattern = factory.patterns.restaurant("restaurant-1");
      expect(pattern).toBe(`${CACHE_NAMESPACE}:*:restaurant-1`);
    });
  });
});
