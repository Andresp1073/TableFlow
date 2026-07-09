import { z } from "zod";

const nameSchema = z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters");
const codeSchema = z.string().min(1, "Code is required").max(30, "Code must not exceed 30 characters");

export const diningAreaParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
  }),
};

export const diningAreaIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    diningAreaId: z.string().uuid("Dining area ID must be a valid UUID"),
  }),
};

export const createDiningAreaSchema = {
  body: z.object({
    name: nameSchema,
    code: codeSchema,
    description: z.string().max(500).optional().nullable(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    isReservable: z.boolean().optional(),
  }),
};

export const updateDiningAreaSchema = {
  body: z.object({
    name: nameSchema,
    code: codeSchema,
    description: z.string().max(500).optional().nullable(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    isReservable: z.boolean().optional(),
  }),
};

export const archiveDiningAreaSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    diningAreaId: z.string().uuid("Dining area ID must be a valid UUID"),
  }),
};

export const listDiningAreasQuerySchema = {
  query: z.object({
    status: z.enum(["active", "archived"]).optional(),
  }),
};
