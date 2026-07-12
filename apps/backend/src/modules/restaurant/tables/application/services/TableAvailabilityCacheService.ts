import type { CacheProvider } from "../../../../../shared/cache/domain/CacheProvider.js";

export class TableAvailabilityCacheService {
  private static readonly BASE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly cache: CacheProvider) {}

  async getBusinessHours(restaurantId: string): Promise<unknown | undefined> {
    const key = this.businessHoursKey(restaurantId);
    return this.cache.get<unknown>(key);
  }

  async setBusinessHours(restaurantId: string, data: unknown): Promise<void> {
    const key = this.businessHoursKey(restaurantId);
    await this.cache.set(key, data, TableAvailabilityCacheService.BASE_TTL_MS);
  }

  async invalidateBusinessHours(restaurantId: string): Promise<void> {
    await this.cache.delete(this.businessHoursKey(restaurantId));
  }

  async getCalendarExceptions(restaurantId: string, date: string): Promise<unknown | undefined> {
    const key = this.calendarExceptionKey(restaurantId, date);
    return this.cache.get<unknown>(key);
  }

  async setCalendarExceptions(restaurantId: string, date: string, data: unknown): Promise<void> {
    const key = this.calendarExceptionKey(restaurantId, date);
    await this.cache.set(key, data, TableAvailabilityCacheService.BASE_TTL_MS);
  }

  async invalidateCalendarExceptions(restaurantId: string, date?: string): Promise<void> {
    if (date) {
      await this.cache.delete(this.calendarExceptionKey(restaurantId, date));
    } else {
      await this.cache.deleteByPattern(`availability:calendar-exceptions:${restaurantId}:*`);
    }
  }

  async getReservationPolicy(restaurantId: string): Promise<unknown | undefined> {
    const key = this.reservationPolicyKey(restaurantId);
    return this.cache.get<unknown>(key);
  }

  async setReservationPolicy(restaurantId: string, data: unknown): Promise<void> {
    const key = this.reservationPolicyKey(restaurantId);
    await this.cache.set(key, data, TableAvailabilityCacheService.BASE_TTL_MS);
  }

  async invalidateReservationPolicy(restaurantId: string): Promise<void> {
    await this.cache.delete(this.reservationPolicyKey(restaurantId));
  }

  async getRestaurantSettings(restaurantId: string): Promise<unknown | undefined> {
    const key = this.restaurantSettingsKey(restaurantId);
    return this.cache.get<unknown>(key);
  }

  async setRestaurantSettings(restaurantId: string, data: unknown): Promise<void> {
    const key = this.restaurantSettingsKey(restaurantId);
    await this.cache.set(key, data, TableAvailabilityCacheService.BASE_TTL_MS);
  }

  async invalidateRestaurantSettings(restaurantId: string): Promise<void> {
    await this.cache.delete(this.restaurantSettingsKey(restaurantId));
  }

  async invalidateAll(restaurantId: string): Promise<void> {
    await this.cache.deleteByPattern(`availability:${restaurantId}:*`);
  }

  private businessHoursKey(restaurantId: string): string {
    return `availability:${restaurantId}:business-hours`;
  }

  private calendarExceptionKey(restaurantId: string, date: string): string {
    return `availability:${restaurantId}:calendar-exceptions:${date}`;
  }

  private reservationPolicyKey(restaurantId: string): string {
    return `availability:${restaurantId}:reservation-policy`;
  }

  private restaurantSettingsKey(restaurantId: string): string {
    return `availability:${restaurantId}:settings`;
  }
}
