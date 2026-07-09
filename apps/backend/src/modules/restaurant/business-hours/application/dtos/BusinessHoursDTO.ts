export interface OpeningPeriodDTO {
  openTime: string;
  closeTime: string;
  order: number;
}

export interface DayScheduleDTO {
  dayOfWeek: number;
  isClosed: boolean;
  periods: OpeningPeriodDTO[];
}

export interface BusinessHoursDTO {
  id: string;
  restaurantId: string;
  schedules: DayScheduleDTO[];
  createdAt: string;
  updatedAt: string;
}
