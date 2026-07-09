export interface CreateBusinessHoursCommand {
  restaurantId: string;
  schedules: Array<{
    dayOfWeek: number;
    isClosed: boolean;
    periods: Array<{
      openTime: string;
      closeTime: string;
      order: number;
    }>;
  }>;
}
