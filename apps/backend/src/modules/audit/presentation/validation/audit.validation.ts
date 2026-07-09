import { z } from "zod";

export const auditEntryIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Audit entry ID must be a valid UUID"),
  }),
};

export const listAuditEntriesQuerySchema = {
  query: z.object({
    module: z.string().max(50).optional(),
    entityType: z.string().max(50).optional(),
    entityId: z.string().uuid().optional(),
    action: z.string().max(50).optional(),
    performedBy: z.string().uuid().optional(),
    restaurantId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
};
