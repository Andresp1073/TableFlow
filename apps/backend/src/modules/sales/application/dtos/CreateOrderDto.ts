import { z } from 'zod';

export const CreateOrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  menuItemName: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().min(0),
  modifiers: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional().default(null),
  stationId: z.string().nullable().optional().default(null),
});

export const CreateOrderSchema = z.object({
  tableId: z.string().nullable().optional().default(null),
  customerId: z.string().nullable().optional().default(null),
  customerName: z.string().nullable().optional().default(null),
  customerCount: z.number().int().positive().nullable().optional().default(null),
  source: z.enum(["pos", "online", "walk_in", "phone", "tablet"]).optional().default("pos"),
  items: z.array(CreateOrderItemSchema).optional().default([]),
  notes: z.array(z.string()).optional().default([]),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type CreateOrderItemDto = z.infer<typeof CreateOrderItemSchema>;
