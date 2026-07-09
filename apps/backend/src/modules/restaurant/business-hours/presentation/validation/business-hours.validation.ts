import { z } from "zod";

export const businessHoursParamsSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const openingPeriodSchema = z.object({
  openTime: z.string().regex(timeRegex, "openTime must be in HH:MM format"),
  closeTime: z.string().regex(timeRegex, "closeTime must be in HH:MM format"),
  order: z.number().int().min(0),
});

export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  isClosed: z.boolean(),
  periods: z.array(openingPeriodSchema),
});

export const updateBusinessHoursSchema = {
  body: z.object({
    schedules: z
      .array(dayScheduleSchema)
      .min(1, "At least one day schedule is required")
      .max(7, "Maximum 7 day schedules"),
  }),
};
