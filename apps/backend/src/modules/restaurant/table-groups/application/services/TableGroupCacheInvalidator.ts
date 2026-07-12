export interface TableGroupCacheInvalidator {
  invalidateOnCreate(restaurantId: string): Promise<void>;
  invalidateOnUpdate(groupId: string, restaurantId: string): Promise<void>;
  invalidateOnRelease(groupId: string, restaurantId: string): Promise<void>;
}
