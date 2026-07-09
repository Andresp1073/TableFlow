import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const validTypes = [
  "holiday",
  "special_opening",
  "temporary_closure",
  "maintenance",
  "private_event",
  "seasonal_hours",
  "emergency_closure",
] as const;

export const calendarExceptionParamsSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

export const calendarExceptionIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
    exceptionId: z.string().uuid("Invalid calendar exception ID format"),
  }),
};

export const createCalendarExceptionSchema = {
  body: z.object({
    title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
    description: z.string().optional().nullable(),
    type: z.enum(validTypes, {
      errorMap: () => ({ message: `Type must be one of: ${validTypes.join(", ")}` }),
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    isClosed: z.boolean(),
    openTime: z.string().regex(timeRegex, "openTime must be in HH:MM format").optional().nullable(),
    closeTime: z.string().regex(timeRegex, "closeTime must be in HH:MM format").optional().nullable(),
    allDay: z.boolean(),
    priority: z.number().int().min(0).max(100).optional(),
  }).refine(
    (data) => {
      if (!data.isClosed && (!data.openTime || !data.closeTime)) {
        return false;
      }
      return true;
    },
    { message: "openTime and closeTime are required when isClosed is false", path: ["openTime"] },
  ).refine(
    (data) => {
      if (data.isClosed && (data.openTime || data.closeTime)) {
        return false;
      }
      return true;
    },
    { message: "Closed exception cannot contain opening hours", path: ["isClosed"] },
  ),
};

export const updateCalendarExceptionSchema = {
  body: z.object({
    title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
    description: z.string().optional().nullable(),
    type: z.enum(validTypes, {
      errorMap: () => ({ message: `Type must be one of: ${validTypes.join(", ")}` }),
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    isClosed: z.boolean(),
    openTime: z.string().regex(timeRegex, "openTime must be in HH:MM format").optional().nullable(),
    closeTime: z.string().regex(timeRegex, "closeTime must be in HH:MM format").optional().nullable(),
    allDay: z.boolean(),
    priority: z.number().int().min(0).max(100).optional(),
  }).refine(
    (data) => {
      if (!data.isClosed && (!data.openTime || !data.closeTime)) {
        return false;
      }
      return true;
    },
    { message: "openTime and closeTime are required when isClosed is false", path: ["openTime"] },
  ).refine(
    (data) => {
      if (data.isClosed && (data.openTime || data.closeTime)) {
        return false;
      }
      return true;
    },
    { message: "Closed exception cannot contain opening hours", path: ["isClosed"] },
  ),
};

export const listCalendarExceptionsQuerySchema = {
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format").optional(),
  }),
};
