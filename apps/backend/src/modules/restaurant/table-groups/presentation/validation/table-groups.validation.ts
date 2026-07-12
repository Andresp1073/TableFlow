import { z } from "zod";

const statusSchema = z.enum(["active", "reserved", "occupied", "released", "archived"]);

export const tableParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
  }),
};

export const tableGroupIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    groupId: z.string().uuid("Table group ID must be a valid UUID"),
  }),
};

export const createTableGroupSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
    description: z.string().max(500, "Description must not exceed 500 characters").optional(),
    tableIds: z
      .array(z.string().uuid("Each table ID must be a valid UUID"))
      .min(2, "At least 2 tables are required")
      .max(50, "Maximum 50 tables per group"),
  }),
};

export const updateTableGroupSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters")
      .optional(),
    description: z.string().max(500, "Description must not exceed 500 characters").optional(),
    tableIds: z
      .array(z.string().uuid("Each table ID must be a valid UUID"))
      .min(2, "At least 2 tables are required")
      .max(50, "Maximum 50 tables per group")
      .optional(),
  }),
};

export const listTableGroupsQuerySchema = {
  query: z.object({
    status: statusSchema.optional(),
  }),
};
