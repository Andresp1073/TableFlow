import { z } from 'zod';

const codeRegex = /^[A-Z0-9][A-Z0-9_-]{0,28}[A-Z0-9]$|^[A-Z0-9]$/;

export const createDiningAreaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(30, 'Code must not exceed 30 characters')
    .regex(codeRegex, 'Code must be uppercase alphanumeric (e.g. MAIN_HALL)'),
  description: z.string().max(500, 'Description must not exceed 500 characters').nullable().optional(),
  displayOrder: z.coerce.number().int('Must be a whole number').min(0, 'Min 0').max(9999, 'Max 9999').optional(),
  isReservable: z.boolean().optional(),
});

export const updateDiningAreaSchema = createDiningAreaSchema.partial();

export type CreateDiningAreaFormData = z.infer<typeof createDiningAreaSchema>;
export type UpdateDiningAreaFormData = z.infer<typeof updateDiningAreaSchema>;
