import type { DaySchedule } from "./DaySchedule.js";

export interface BusinessHours {
  id: string;
  restaurantId: string;
  schedules: readonly DaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}
