import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timezonePattern = /^[A-Za-z]+(?:\/[A-Za-z_]+)?$/;
const currencyPattern = /^[A-Z]{3}$/;
const languagePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;

export const createRestaurantSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, "Restaurant name is required")
      .max(255, "Restaurant name cannot exceed 255 characters")
      .trim(),
    slug: z
      .string()
      .min(1, "Restaurant slug is required")
      .max(100, "Restaurant slug cannot exceed 100 characters")
      .regex(slugPattern, "Slug must contain only lowercase letters, numbers, and hyphens")
      .transform((v) => v.toLowerCase()),
    legalName: z.string().max(255).trim().nullable().optional(),
    taxId: z.string().min(3).max(50).trim().nullable().optional(),
    email: z.string().email("Invalid email format").max(255).transform((v) => v.toLowerCase().trim()).nullable().optional(),
    phone: z.string().min(6).max(20).trim().nullable().optional(),
    website: z.string().max(500).trim().nullable().optional(),
    logoUrl: z.string().max(500).trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    timezone: z
      .string()
      .regex(timezonePattern, "Must be a valid IANA timezone identifier (e.g., America/New_York)")
      .max(50)
      .optional()
      .default("UTC"),
    currency: z
      .string()
      .regex(currencyPattern, "Must be a 3-letter ISO 4217 currency code")
      .transform((v) => v.toUpperCase())
      .optional()
      .default("USD"),
    language: z
      .string()
      .regex(languagePattern, "Must be a valid ISO 639-1 language code")
      .optional()
      .default("en"),
  }),
};

export const updateRestaurantSchema = {
  body: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(slugPattern, "Slug must contain only lowercase letters, numbers, and hyphens")
      .transform((v) => v.toLowerCase())
      .optional(),
    legalName: z.string().max(255).trim().nullable().optional(),
    taxId: z.string().min(3).max(50).trim().nullable().optional(),
    email: z.string().email("Invalid email format").max(255).transform((v) => v.toLowerCase().trim()).nullable().optional(),
    phone: z.string().min(6).max(20).trim().nullable().optional(),
    website: z.string().max(500).trim().nullable().optional(),
    logoUrl: z.string().max(500).trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
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
  }),
};

export const restaurantIdParamSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

export const listRestaurantsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    status: z
      .enum(["draft", "pending", "active", "suspended", "inactive", "archived"])
      .optional(),
    search: z.string().max(255).optional(),
    sortBy: z.enum(["name", "slug", "createdAt", "updatedAt", "status"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
};

export const archiveRestaurantSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

export const activateRestaurantSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
};

export const suspendRestaurantSchema = {
  params: z.object({
    id: z.string().uuid("Invalid restaurant ID format"),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
};
