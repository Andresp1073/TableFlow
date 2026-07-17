import { z } from 'zod';

const tableNumberRegex = /^[A-Za-z0-9][A-Za-z0-9_-]{0,8}[A-Za-z0-9]$|^[A-Za-z0-9]$/;

const shapeEnum = z.enum(['square', 'rectangle', 'round', 'oval', 'custom']);

const baseTableSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  diningAreaId: z.string().nullable().optional(),
  tableTypeId: z.string().nullable().optional(),
  tableNumber: z
    .string()
    .min(1, 'Table number is required')
    .max(10, 'Table number must not exceed 10 characters')
    .regex(tableNumberRegex, 'Table number must be alphanumeric (e.g. T01)'),
  name: z.string().max(100, 'Name must not exceed 100 characters').nullable().optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').nullable().optional(),
  minimumCapacity: z.coerce.number().int('Must be a whole number').min(1, 'Min 1').max(999, 'Max 999'),
  maximumCapacity: z.coerce.number().int('Must be a whole number').min(1, 'Min 1').max(999, 'Max 999'),
  currentCapacity: z.coerce.number().int('Must be a whole number').min(0, 'Min 0').optional(),
  shape: shapeEnum.optional(),
  width: z.coerce.number().int('Must be a whole number').min(20, 'Min 20').max(500, 'Max 500').optional(),
  height: z.coerce.number().int('Must be a whole number').min(20, 'Min 20').max(500, 'Max 500').optional(),
  positionX: z.coerce.number().nullable().optional(),
  positionY: z.coerce.number().nullable().optional(),
  rotation: z.coerce.number().nullable().optional(),
  qrIdentifier: z.string().max(100).nullable().optional(),
  isReservable: z.boolean().optional(),
  isAccessible: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const createTableSchema = baseTableSchema.refine((data) => data.maximumCapacity >= data.minimumCapacity, {
  message: 'Maximum capacity must be at least minimum capacity',
  path: ['maximumCapacity'],
});

export const updateTableSchema = baseTableSchema.partial();

export const statusChangeSchema = z.object({
  status: z.enum([
    'available', 'occupied', 'reserved', 'cleaning',
    'out_of_service', 'blocked', 'maintenance',
  ] as const),
  reason: z.string().max(200).optional(),
});

export type CreateTableFormData = z.infer<typeof createTableSchema>;
export type UpdateTableFormData = z.infer<typeof updateTableSchema>;
export type StatusChangeFormData = z.infer<typeof statusChangeSchema>;
