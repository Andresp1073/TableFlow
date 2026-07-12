import { z } from "zod";

const nameSchema = z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters");
const codeSchema = z.string().min(1, "Code is required").max(30, "Code must not exceed 30 characters");

export const tableTypeParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
  }),
};

export const tableTypeIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    tableTypeId: z.string().uuid("Table type ID must be a valid UUID"),
  }),
};

export const createTableTypeSchema = {
  body: z.object({
    name: nameSchema,
    code: codeSchema,
    description: z.string().max(500).optional().nullable(),
    defaultCapacity: z.number().int().min(1).max(999),
    minimumCapacity: z.number().int().min(1).max(999),
    maximumCapacity: z.number().int().min(1).max(999),
    shape: z.enum(["square", "rectangle", "round", "oval", "custom"]),
    isReservable: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    metadata: z.record(z.unknown()).optional().nullable(),
  }),
};

export const updateTableTypeSchema = {
  body: z.object({
    name: nameSchema,
    code: codeSchema,
    description: z.string().max(500).optional().nullable(),
    defaultCapacity: z.number().int().min(1).max(999),
    minimumCapacity: z.number().int().min(1).max(999),
    maximumCapacity: z.number().int().min(1).max(999),
    shape: z.enum(["square", "rectangle", "round", "oval", "custom"]),
    isReservable: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    metadata: z.record(z.unknown()).optional().nullable(),
  }),
};

export const archiveTableTypeSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    tableTypeId: z.string().uuid("Table type ID must be a valid UUID"),
  }),
};

export const listTableTypesQuerySchema = {
  query: z.object({
    status: z.enum(["active", "archived"]).optional(),
  }),
};
