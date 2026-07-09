import type { CalendarException } from "../models/CalendarException.js";

export interface CalendarExceptionRepository {
  findByRestaurantId(restaurantId: string): Promise<CalendarException[]>;
  findById(id: string): Promise<CalendarException | null>;
  findByRestaurantIdAndDate(restaurantId: string, date: string): Promise<CalendarException[]>;
  findByRestaurantIdAndDateRange(restaurantId: string, startDate: string, endDate: string): Promise<CalendarException[]>;
  findByDateAndType(restaurantId: string, date: string, type: string): Promise<CalendarException | null>;
  save(calendarException: CalendarException): Promise<CalendarException>;
  update(calendarException: CalendarException): Promise<CalendarException>;
  delete(id: string): Promise<void>;
}
