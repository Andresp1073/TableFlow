import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255)
  .transform((v) => v.toLowerCase().trim());

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:MM (24h)');

export function parsePaginationParams(query: Record<string, unknown>) {
  return paginationSchema.parse(query);
}
