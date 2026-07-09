import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timezonePattern = /^[A-Za-z]+(?:\/[A-Za-z_]+)?$/;
const currencyPattern = /^[A-Z]{3}$/;
const languagePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const dateFormatPattern = /^(YYYY-MM-DD|DD\/MM\/YYYY|MM\/DD\/YYYY|DD\.MM\.YYYY|DD-MM-YYYY|YYYY\/MM\/DD)$/;
const timeFormatPattern = /^(HH:mm|hh:mm A|hh:mm a|HH:mm:ss|hh:mm:ss A)$/;

export const restaurantSettingsParamsSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

export const createRestaurantSettingsSchema = {
  body: z.object({
    timezone: z
      .string()
      .regex(timezonePattern, "Must be a valid IANA timezone identifier")
      .max(50)
      .optional(),
    currency: z
      .string()
      .regex(currencyPattern, "Must be a 3-letter ISO 4217 currency code")
      .transform((v) => v.toUpperCase())
      .optional(),
    language: z
      .string()
      .regex(languagePattern, "Must be a valid ISO 639-1 language code")
      .optional(),
    dateFormat: z
      .string()
      .regex(dateFormatPattern, "Must be a valid date format (e.g., YYYY-MM-DD)")
      .optional(),
    timeFormat: z
      .string()
      .regex(timeFormatPattern, "Must be a valid time format (e.g., HH:mm)")
      .optional(),
    weekStartsOn: z
      .number()
      .int()
      .min(0)
      .max(6)
      .optional(),
    taxPercentage: z
      .number()
      .min(0)
      .max(100)
      .optional(),
    serviceChargePercentage: z
      .number()
      .min(0)
      .max(100)
      .optional(),
    defaultReservationDuration: z
      .number()
      .int()
      .min(15)
      .max(480)
      .optional(),
    reservationBufferMinutes: z
      .number()
      .int()
      .min(0)
      .max(120)
      .optional(),
    allowWalkIns: z.boolean().optional(),
    autoConfirmReservations: z.boolean().optional(),
    maxReservationsPerCustomer: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional(),
    reservationCancellationHours: z
      .number()
      .int()
      .min(0)
      .max(720)
      .optional(),
  }),
};

export const updateRestaurantSettingsSchema = createRestaurantSettingsSchema;
