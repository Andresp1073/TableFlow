import type { CacheInvalidationService } from "../domain/CacheInvalidationService.js";
import type { CacheKeyFactory } from "../domain/CacheKeyFactory.js";
import type { CacheProvider } from "../domain/CacheProvider.js";

export class CacheInvalidationServiceImpl implements CacheInvalidationService {
  constructor(
    private readonly cache: CacheProvider,
    private readonly keyFactory: CacheKeyFactory
  ) {}

  async invalidateUser(userId: string): Promise<void> {
    const pattern = this.keyFactory.patterns.allUser(userId);
    await this.cache.deleteByPattern(pattern);
  }

  async invalidateUserForRestaurant(
    userId: string,
    restaurantId: string
  ): Promise<void> {
    await Promise.all([
      this.cache.delete(this.keyFactory.userPermissions(userId, restaurantId)),
      this.cache.delete(this.keyFactory.userRoles(userId, restaurantId)),
    ]);
  }

  async invalidateRestaurant(restaurantId: string): Promise<void> {
    const pattern = this.keyFactory.patterns.restaurant(restaurantId);
    await this.cache.deleteByPattern(pattern);
  }

  async invalidateAll(): Promise<void> {
    await this.cache.clear();
  }
}
