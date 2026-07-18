import { z } from 'zod';

export const SubmitOrderSchema = z.object({
  kitchenId: z.string().min(1),
});

export const ProcessPaymentSchema = z.object({
  providerId: z.string().min(1),
  methodType: z.string().min(1),
  tipAmount: z.number().min(0).optional().default(0),
});

export type SubmitOrderDto = z.infer<typeof SubmitOrderSchema>;
export type ProcessPaymentDto = z.infer<typeof ProcessPaymentSchema>;

export interface CheckoutResultDto {
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentTransactionId: string | null;
  kitchenTickets: string[];
  total: number;
  paid: number;
  change: number;
}

export interface ReceiptDto {
  orderId: string;
  restaurantId: string;
  tableId: string | null;
  customerName: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentStatus: string;
  paidAt: string | null;
}
