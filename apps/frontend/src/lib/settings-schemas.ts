import { z } from 'zod';

export const updateSettingsSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required').optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  language: z.string().min(2, 'Language code is required').max(10).optional(),
  dateFormat: z.string().min(1, 'Date format is required').optional(),
  timeFormat: z.string().min(1, 'Time format is required').optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  serviceChargePercentage: z.number().min(0).max(100).optional(),
  defaultReservationDuration: z.number().int().min(15).max(480).optional(),
  reservationBufferMinutes: z.number().int().min(0).max(120).optional(),
  allowWalkIns: z.boolean().optional(),
  autoConfirmReservations: z.boolean().optional(),
  maxReservationsPerCustomer: z.number().int().min(1).max(100).optional(),
  reservationCancellationHours: z.number().int().min(0).max(720).optional(),
});

export type UpdateSettingsFormData = z.infer<typeof updateSettingsSchema>;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const openingPeriodSchema = z.object({
  openTime: z.string().regex(timeRegex, 'Invalid time (HH:MM)'),
  closeTime: z.string().regex(timeRegex, 'Invalid time (HH:MM)'),
  order: z.number().int().min(0),
}).refine(data => data.openTime < data.closeTime, {
  message: 'Open time must be before close time',
  path: ['closeTime'],
});

export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  isClosed: z.boolean(),
  periods: z.array(openingPeriodSchema).min(1).optional(),
}).refine(data => data.isClosed || (data.periods && data.periods.length > 0), {
  message: 'At least one period is required when the day is open',
  path: ['periods'],
});

export const updateBusinessHoursSchema = z.object({
  schedules: z.array(dayScheduleSchema).min(1).max(7),
});

export type UpdateBusinessHoursFormData = z.infer<typeof updateBusinessHoursSchema>;
