import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const checkAvailabilityParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    tableId: z.string().uuid("Table ID must be a valid UUID"),
  }),
  query: z.object({
    date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
    time: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
    partySize: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
    duration: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
  }),
};

export const listAvailableTablesQuerySchema = {
  query: z.object({
    date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
    time: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
    partySize: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
    duration: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
    diningAreaId: z.string().uuid("Dining area ID must be a valid UUID").optional(),
    tableTypeId: z.string().uuid("Table type ID must be a valid UUID").optional(),
    minCapacity: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
    maxCapacity: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
    isAccessible: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  }),
};
