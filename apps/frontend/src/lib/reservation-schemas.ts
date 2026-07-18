import { z } from 'zod';
import { RESERVATION_SOURCE_OPTIONS } from './reservation-types';

export const createReservationSchema = z.object({
  reservationNumber: z.string().min(1, 'Reservation number is required').max(20, 'Must not exceed 20 characters'),
  customerId: z.string().uuid('Invalid customer').nullable().optional(),
  tableId: z.string().uuid('Invalid table').nullable().optional(),
  tableGroupId: z.string().uuid('Invalid table group').nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  partySize: z.coerce.number().int('Must be a whole number').min(1, 'Minimum 1 guest').max(100, 'Maximum 100 guests'),
  source: z.string().refine((val) => RESERVATION_SOURCE_OPTIONS.some((o) => o.value === val), 'Invalid source'),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').nullable().optional(),
  specialRequests: z.string().max(2000, 'Special requests must not exceed 2000 characters').nullable().optional(),
});

export const updateReservationSchema = z.object({
  customerId: z.string().uuid('Invalid customer').nullable().optional(),
  tableId: z.string().uuid('Invalid table').nullable().optional(),
  tableGroupId: z.string().uuid('Invalid table group').nullable().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  partySize: z.coerce.number().int('Must be a whole number').min(1, 'Minimum 1 guest').max(100, 'Maximum 100 guests').optional(),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').nullable().optional(),
  specialRequests: z.string().max(2000, 'Special requests must not exceed 2000 characters').nullable().optional(),
});

export const reservationSearchSchema = z.object({
  query: z.string().max(100).optional(),
  status: z.string().max(20).optional(),
  date: z.string().optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minPartySize: z.coerce.number().int().min(1).optional(),
  maxPartySize: z.coerce.number().int().max(100).optional(),
  source: z.string().optional(),
});

export type CreateReservationFormData = z.infer<typeof createReservationSchema>;
export type UpdateReservationFormData = z.infer<typeof updateReservationSchema>;
export type ReservationSearchFormData = z.infer<typeof reservationSearchSchema>;
