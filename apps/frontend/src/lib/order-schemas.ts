import { z } from 'zod';
import { TICKET_STATUS_LABELS } from './order-types';

export const updateTicketStatusSchema = z.object({
  status: z.string().refine(
    (val) => Object.keys(TICKET_STATUS_LABELS).includes(val),
    'Invalid ticket status',
  ),
  reason: z.string().max(500).optional(),
});

export const createTicketSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  stationId: z.string().min(1, 'Station is required'),
  tableId: z.string().optional(),
  customerName: z.string().max(100).optional(),
  customerCount: z.coerce.number().int().min(1).max(50).optional(),
  priority: z.enum(['normal', 'high', 'urgent', 'vip', 'delayed']),
  notes: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        menuItemName: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
        modifiers: z.array(z.string()).optional(),
        notes: z.string().max(500).optional(),
        estimatedPrepTimeSeconds: z.coerce.number().int().min(0).optional(),
      }),
    )
    .min(1, 'At least one item is required'),
});

export type UpdateTicketStatusFormData = z.infer<typeof updateTicketStatusSchema>;
export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
