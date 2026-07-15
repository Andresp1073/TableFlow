import type { PaymentProviderRepository } from "../../domain/repositories/PaymentProviderRepository.js";
import { PaymentProvider } from "../../domain/models/PaymentProvider.js";
import { PaymentProviderStatus } from "../../domain/models/PaymentProvider.js";
import type { PaymentProviderFeature } from "../../domain/models/PaymentProvider.js";

export class PaymentProviderService {
  constructor(private readonly repository: PaymentProviderRepository) {}

  async findById(id: string): Promise<PaymentProvider | null> {
    return this.repository.findById(id);
  }

  async findByName(name: string): Promise<PaymentProvider | null> {
    return this.repository.findByName(name);
  }

  async findAll(): Promise<PaymentProvider[]> {
    return this.repository.findAll();
  }

  async findAvailable(): Promise<PaymentProvider[]> {
    return this.repository.findAvailable();
  }

  async findByFeature(feature: PaymentProviderFeature): Promise<PaymentProvider[]> {
    const all = await this.repository.findByFeature(feature);
    return all.filter((p) => p.isAvailable());
  }

  async registerProvider(config: {
    id: string;
    name: string;
    displayName: string;
    supportedFeatures: PaymentProviderFeature[];
    supportedMethods: string[];
    priority: number;
    website?: string;
  }): Promise<PaymentProvider> {
    const provider = PaymentProvider.create({
      ...config,
      status: PaymentProviderStatus.Active,
      isEnabled: true,
    });

    await this.repository.save(provider);
    return provider;
  }

  async activateProvider(id: string): Promise<PaymentProvider> {
    const provider = await this.repository.findById(id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }
    const activated = provider.activate();
    await this.repository.save(activated);
    return activated;
  }

  async deactivateProvider(id: string): Promise<PaymentProvider> {
    const provider = await this.repository.findById(id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }
    const deactivated = provider.deactivate();
    await this.repository.save(deactivated);
    return deactivated;
  }
}
