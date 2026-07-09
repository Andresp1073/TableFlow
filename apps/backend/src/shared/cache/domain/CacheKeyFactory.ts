export interface CacheKeyPatterns {
  userPermissions(userId: string): string;
  userRoles(userId: string): string;
  allUser(userId: string): string;
  restaurant(restaurantId: string): string;
}

export interface CacheKeyFactory {
  userPermissions(userId: string, restaurantId: string): string;
  userRoles(userId: string, restaurantId: string): string;
  patterns: CacheKeyPatterns;
}
