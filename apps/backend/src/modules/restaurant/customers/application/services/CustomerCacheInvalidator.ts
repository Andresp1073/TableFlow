export interface CustomerCacheInvalidator {
  invalidateOnCreate(restaurantId: string): Promise<void>;
  invalidateOnUpdate(customerId: string, restaurantId: string): Promise<void>;
  invalidateOnArchive(customerId: string, restaurantId: string): Promise<void>;
}
