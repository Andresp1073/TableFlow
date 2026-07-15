import type { PaymentTransactionRepository } from "../../domain/repositories/PaymentTransactionRepository.js";
import type { PaymentProviderRepository } from "../../domain/repositories/PaymentProviderRepository.js";
import type { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import type { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import type { PaymentProvider } from "../../domain/models/PaymentProvider.js";
import { PaymentProviderStatus } from "../../domain/models/PaymentProvider.js";

export class InMemoryPaymentTransactionRepository implements PaymentTransactionRepository {
  private readonly transactions: Map<string, PaymentTransaction> = new Map();

  async findById(id: string): Promise<PaymentTransaction | null> {
    return this.transactions.get(id) ?? null;
  }

  async findByIntent(intentId: string): Promise<PaymentTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.intentId === intentId);
  }

  async findByRestaurant(restaurantId: string): Promise<PaymentTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.restaurantId === restaurantId);
  }

  async findByProvider(providerId: string): Promise<PaymentTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.providerId === providerId);
  }

  async findByStatus(status: PaymentTransactionStatus): Promise<PaymentTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.status === status);
  }

  async findByProviderReference(reference: string): Promise<PaymentTransaction | null> {
    return Array.from(this.transactions.values()).find((t) => t.providerReference === reference) ?? null;
  }

  async save(transaction: PaymentTransaction): Promise<void> {
    this.transactions.set(transaction.id, transaction);
  }

  async delete(id: string): Promise<void> {
    this.transactions.delete(id);
  }
}

export class InMemoryPaymentProviderRepository implements PaymentProviderRepository {
  private readonly providers: Map<string, PaymentProvider> = new Map();

  async findById(id: string): Promise<PaymentProvider | null> {
    return this.providers.get(id) ?? null;
  }

  async findByName(name: string): Promise<PaymentProvider | null> {
    return Array.from(this.providers.values()).find((p) => p.name === name) ?? null;
  }

  async findAll(): Promise<PaymentProvider[]> {
    return Array.from(this.providers.values());
  }

  async findAvailable(): Promise<PaymentProvider[]> {
    return Array.from(this.providers.values()).filter(
      (p) => p.isAvailable(),
    );
  }

  async findByStatus(status: PaymentProviderStatus): Promise<PaymentProvider[]> {
    return Array.from(this.providers.values()).filter((p) => p.status === status);
  }

  async findByFeature(feature: string): Promise<PaymentProvider[]> {
    return Array.from(this.providers.values()).filter(
      (p) => p.supportedFeatures.includes(feature as any),
    );
  }

  async save(provider: PaymentProvider): Promise<void> {
    this.providers.set(provider.id, provider);
  }

  async delete(id: string): Promise<void> {
    this.providers.delete(id);
  }
}
