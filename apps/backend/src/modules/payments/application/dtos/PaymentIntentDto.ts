export interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  reference: string;
  customerId?: string;
  customerEmail?: string;
  restaurantId: string;
  reservationId?: string;
  description?: string;
  allowedMethods: string[];
  metadata: Record<string, string>;
  expiresInMinutes?: number;
}

export interface PaymentIntentResponseDto {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  allowedMethods: string[];
  createdAt: Date;
  expiresAt: Date | null;
}
