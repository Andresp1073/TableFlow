import { z } from 'zod';

export const refundSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive').optional(),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
});

export type RefundFormData = z.infer<typeof refundSchema>;
