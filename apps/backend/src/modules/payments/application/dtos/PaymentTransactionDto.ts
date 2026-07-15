import type { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";

export interface CreatePaymentTransactionDto {
  intentId: string;
  providerId: string;
  restaurantId: string;
  reservationId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  methodType: string;
  metadata: Record<string, string>;
}

export interface PaymentTransactionResponseDto {
  id: string;
  intentId: string;
  providerId: string;
  restaurantId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  methodType: string;
  providerReference: string | null;
  authorizationCode: string | null;
  capturedAmount: number | null;
  refundedAmount: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
