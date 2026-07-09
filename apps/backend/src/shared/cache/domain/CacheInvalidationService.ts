export interface CacheInvalidationService {
  invalidateUser(userId: string): Promise<void>;
  invalidateUserForRestaurant(userId: string, restaurantId: string): Promise<void>;
  invalidateRestaurant(restaurantId: string): Promise<void>;
  invalidateAll(): Promise<void>;
}
