import { z } from 'zod';

export const UpdateOrderSchema = z.object({
  tableId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerCount: z.number().int().positive().nullable().optional(),
  notes: z.array(z.string()).optional(),
});

export type UpdateOrderDto = z.infer<typeof UpdateOrderSchema>;
