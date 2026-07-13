export interface ReservationCacheInvalidator {
  invalidateOnCreate(restaurantId: string): Promise<void>;
  invalidateOnUpdate(reservationId: string, restaurantId: string): Promise<void>;
  invalidateOnStatusChange(reservationId: string, restaurantId: string): Promise<void>;
}
