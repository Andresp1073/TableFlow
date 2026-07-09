import type { BusinessHours } from "../models/BusinessHours.js";
import type { DayOfWeek } from "../models/DayOfWeek.js";
import type { OpeningPeriod } from "../models/OpeningPeriod.js";

export interface CreateBusinessHoursData {
  restaurantId: string;
  schedules: Array<{
    dayOfWeek: DayOfWeek;
    isClosed: boolean;
    periods: OpeningPeriod[];
  }>;
}

export interface ReconstituteOpeningPeriodData {
  openTime: number;
  closeTime: number;
  order: number;
}

export interface ReconstituteDayScheduleData {
  dayOfWeek: number;
  isClosed: boolean;
  periods: ReconstituteOpeningPeriodData[];
}

export interface ReconstituteBusinessHoursData {
  id: string;
  restaurantId: string;
  schedules: ReconstituteDayScheduleData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHoursFactory {
  create(data: CreateBusinessHoursData): BusinessHours;
  reconstitute(data: ReconstituteBusinessHoursData): BusinessHours;
}
