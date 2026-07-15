import type { PaymentProvider } from "../models/PaymentProvider.js";
import type { PaymentProviderStatus } from "../models/PaymentProvider.js";

export interface PaymentProviderRepository {
  findById(id: string): Promise<PaymentProvider | null>;
  findByName(name: string): Promise<PaymentProvider | null>;
  findAll(): Promise<PaymentProvider[]>;
  findAvailable(): Promise<PaymentProvider[]>;
  findByStatus(status: PaymentProviderStatus): Promise<PaymentProvider[]>;
  findByFeature(feature: string): Promise<PaymentProvider[]>;
  save(provider: PaymentProvider): Promise<void>;
  delete(id: string): Promise<void>;
}
