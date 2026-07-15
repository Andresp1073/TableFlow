import type { PaymentTransaction } from "../models/PaymentTransaction.js";
import type { PaymentTransactionStatus } from "../models/PaymentTransaction.js";

export interface PaymentTransactionRepository {
  findById(id: string): Promise<PaymentTransaction | null>;
  findByIntent(intentId: string): Promise<PaymentTransaction[]>;
  findByRestaurant(restaurantId: string): Promise<PaymentTransaction[]>;
  findByProvider(providerId: string): Promise<PaymentTransaction[]>;
  findByStatus(status: PaymentTransactionStatus): Promise<PaymentTransaction[]>;
  findByProviderReference(reference: string): Promise<PaymentTransaction | null>;
  save(transaction: PaymentTransaction): Promise<void>;
  delete(id: string): Promise<void>;
}
