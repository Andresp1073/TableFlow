import type { CacheKeyFactory, CacheKeyPatterns } from "../domain/CacheKeyFactory.js";

export const CACHE_NAMESPACE = "authz";

export class CacheKeyFactoryImpl implements CacheKeyFactory {
  readonly patterns: CacheKeyPatterns = {
    userPermissions: (userId: string) =>
      `${CACHE_NAMESPACE}:permissions:user:${userId}:*`,
    userRoles: (userId: string) =>
      `${CACHE_NAMESPACE}:roles:user:${userId}:*`,
    allUser: (userId: string) =>
      `${CACHE_NAMESPACE}:*:user:${userId}:*`,
    restaurant: (restaurantId: string) =>
      `${CACHE_NAMESPACE}:*:${restaurantId}`,
  };

  userPermissions(userId: string, restaurantId: string): string {
    return `${CACHE_NAMESPACE}:permissions:user:${userId}:${restaurantId}`;
  }

  userRoles(userId: string, restaurantId: string): string {
    return `${CACHE_NAMESPACE}:roles:user:${userId}:${restaurantId}`;
  }
}
