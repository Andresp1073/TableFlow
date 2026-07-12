import { z } from "zod";

export const tableParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
  }),
};

export const tableIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    tableId: z.string().uuid("Table ID must be a valid UUID"),
  }),
};

const shapeSchema = z.enum(["square", "rectangle", "round", "oval", "custom"]);
const statusSchema = z.enum([
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "out_of_service",
  "blocked",
  "maintenance",
  "archived",
]);

export const createTableSchema = {
  body: z.object({
    branchId: z.string().uuid("Branch ID must be a valid UUID"),
    diningAreaId: z.string().uuid("Dining area ID must be a valid UUID").optional().nullable(),
    tableTypeId: z.string().uuid("Table type ID must be a valid UUID").optional().nullable(),
    tableNumber: z.string().min(1, "Table number is required").max(10, "Table number must not exceed 10 characters"),
    name: z.string().max(100).optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    minimumCapacity: z.number().int().min(0).max(999),
    maximumCapacity: z.number().int().min(1).max(999),
    currentCapacity: z.number().int().min(0).max(999).optional(),
    shape: shapeSchema.optional(),
    width: z.number().int().min(1).max(9999).optional(),
    height: z.number().int().min(1).max(9999).optional(),
    positionX: z.number().optional().nullable(),
    positionY: z.number().optional().nullable(),
    rotation: z.number().optional().nullable(),
    qrIdentifier: z.string().max(100).optional().nullable(),
    isReservable: z.boolean().optional(),
    isAccessible: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional().nullable(),
  }),
};

export const updateTableSchema = {
  body: z.object({
    branchId: z.string().uuid("Branch ID must be a valid UUID").optional(),
    diningAreaId: z.string().uuid("Dining area ID must be a valid UUID").optional().nullable(),
    tableTypeId: z.string().uuid("Table type ID must be a valid UUID").optional().nullable(),
    tableNumber: z.string().min(1).max(10),
    name: z.string().max(100).optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    minimumCapacity: z.number().int().min(0).max(999),
    maximumCapacity: z.number().int().min(1).max(999),
    currentCapacity: z.number().int().min(0).max(999).optional(),
    shape: shapeSchema.optional(),
    width: z.number().int().min(1).max(9999).optional(),
    height: z.number().int().min(1).max(9999).optional(),
    positionX: z.number().optional().nullable(),
    positionY: z.number().optional().nullable(),
    rotation: z.number().optional().nullable(),
    qrIdentifier: z.string().max(100).optional().nullable(),
    isReservable: z.boolean().optional(),
    isAccessible: z.boolean().optional(),
    isActive: z.boolean().optional(),
    status: statusSchema.optional(),
    metadata: z.record(z.unknown()).optional().nullable(),
  }),
};

export const archiveTableSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    tableId: z.string().uuid("Table ID must be a valid UUID"),
  }),
};

export const changeTableStatusSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    tableId: z.string().uuid("Table ID must be a valid UUID"),
  }),
  body: z.object({
    status: statusSchema.refine(
      (val) => val !== "archived",
      { message: "Cannot transition to 'archived' via status change; use the archive endpoint instead" },
    ),
    reason: z.string().max(500).optional().nullable(),
  }),
};

export const listTablesQuerySchema = {
  query: z.object({
    diningAreaId: z.string().uuid().optional(),
    tableTypeId: z.string().uuid().optional(),
    status: statusSchema.optional(),
    isReservable: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
    isActive: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
    minCapacity: z.string().optional().transform((v) => v === undefined ? undefined : Number(v)),
  }),
};
