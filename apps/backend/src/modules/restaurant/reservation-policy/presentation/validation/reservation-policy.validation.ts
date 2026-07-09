import { z } from "zod";

export const reservationPolicyParamsSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

export const updateReservationPolicySchema = {
  body: z.object({
    enabled: z.boolean().optional(),
    minPartySize: z.number().int().min(1).max(100).optional(),
    maxPartySize: z.number().int().min(1).max(100).optional(),
    defaultReservationDuration: z.number().int().min(15).max(480).optional(),
    minAdvanceBookingMinutes: z.number().int().min(0).max(43200).optional(),
    maxAdvanceBookingDays: z.number().int().min(0).max(365).optional(),
    cancellationDeadlineMinutes: z.number().int().min(0).max(43200).optional(),
    modificationDeadlineMinutes: z.number().int().min(0).max(43200).optional(),
    allowWalkIns: z.boolean().optional(),
    autoConfirmReservations: z.boolean().optional(),
    requireCustomerPhone: z.boolean().optional(),
    requireCustomerEmail: z.boolean().optional(),
    maxActiveReservationsPerCustomer: z.number().int().min(1).max(100).optional(),
    gracePeriodMinutes: z.number().int().min(0).max(120).optional(),
  }),
};
