import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timezoneRegex = /^[A-Za-z_]+\/[A-Za-z_]+$/;
const currencyRegex = /^[A-Z]{3}$/;
const phoneRegex = /^[\d\s\-+()]+$/;

export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must not exceed 50 characters')
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens'),
  legalName: z.string().max(200).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').nullable().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  address: z.string().max(300).nullable().optional(),
  logoUrl: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  timezone: z.string().regex(timezoneRegex, 'Invalid timezone (e.g. America/New_York)').default('America/New_York'),
  currency: z.string().regex(currencyRegex, 'Invalid currency code (e.g. USD)').default('USD'),
  language: z.string().min(2).max(10).default('en'),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantFormData = z.infer<typeof updateRestaurantSchema>;
