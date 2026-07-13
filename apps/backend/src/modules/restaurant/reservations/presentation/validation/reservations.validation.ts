import { z } from "zod";

export const reservationParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
  }),
};

export const reservationIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    reservationId: z.string().uuid("Reservation ID must be a valid UUID"),
  }),
};

export const createReservationSchema = {
  body: z.object({
    reservationNumber: z
      .string()
      .min(1, "Reservation number is required")
      .max(20, "Reservation number must not exceed 20 characters"),
    customerId: z.string().uuid("Customer ID must be a valid UUID").nullable().optional(),
    tableId: z.string().uuid("Table ID must be a valid UUID").nullable().optional(),
    tableGroupId: z.string().uuid("Table group ID must be a valid UUID").nullable().optional(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    partySize: z
      .number()
      .int("Party size must be an integer")
      .min(1, "Party size must be at least 1")
      .max(100, "Party size must not exceed 100"),
    source: z
      .string()
      .min(1, "Source is required"),
    notes: z.string().nullable().optional(),
    specialRequests: z.string().nullable().optional(),
  }),
};

export const updateReservationSchema = {
  body: z.object({
    customerId: z.string().uuid("Customer ID must be a valid UUID").nullable().optional(),
    tableId: z.string().uuid("Table ID must be a valid UUID").nullable().optional(),
    tableGroupId: z.string().uuid("Table group ID must be a valid UUID").nullable().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    partySize: z
      .number()
      .int("Party size must be an integer")
      .min(1, "Party size must be at least 1")
      .max(100, "Party size must not exceed 100")
      .optional(),
    notes: z.string().nullable().optional(),
    specialRequests: z.string().nullable().optional(),
  }),
};

export const listReservationsQuerySchema = {
  query: z.object({
    status: z.string().max(20).optional(),
    date: z.string().optional(),
    customerId: z.string().uuid("Customer ID must be a valid UUID").optional(),
  }),
};
