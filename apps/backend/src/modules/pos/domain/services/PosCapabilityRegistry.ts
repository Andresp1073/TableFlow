import { PosCapability, POS_CAPABILITIES, POS_PREPARE_ONLY_CAPABILITIES } from "../models/PosCapability.js";
import type { PosProvider } from "../models/PosProvider.js";

export interface CapabilityDiscoveryResult {
  providerId: string;
  providerName: string;
  capabilities: PosCapability[];
  unsupportedCapabilities: PosCapability[];
  prepareOnlyCapabilities: PosCapability[];
}

export class PosCapabilityRegistry {
  private readonly providerCapabilities: Map<string, PosCapability[]> = new Map();

  registerCapabilities(providerId: string, capabilities: PosCapability[]): void {
    this.providerCapabilities.set(providerId, [...capabilities]);
  }

  getCapabilities(providerId: string): PosCapability[] {
    return this.providerCapabilities.get(providerId) ?? [];
  }

  hasCapability(providerId: string, capability: PosCapability): boolean {
    const capabilities = this.providerCapabilities.get(providerId);
    return capabilities ? capabilities.includes(capability) : false;
  }

  discoverCapabilities(provider: PosProvider): CapabilityDiscoveryResult {
    const allCapabilities = [...POS_CAPABILITIES];
    const supported = provider.capabilities;
    const unsupported = allCapabilities.filter((c) => !supported.includes(c));
    const prepareOnly = POS_PREPARE_ONLY_CAPABILITIES.filter((c) => supported.includes(c));

    this.registerCapabilities(provider.id, supported);

    return {
      providerId: provider.id,
      providerName: provider.displayName,
      capabilities: [...supported],
      unsupportedCapabilities: unsupported,
      prepareOnlyCapabilities: prepareOnly,
    };
  }

  compareCapabilities(
    previous: PosCapability[],
    current: PosCapability[],
  ): {
    added: PosCapability[];
    removed: PosCapability[];
  } {
    const added = current.filter((c) => !previous.includes(c));
    const removed = previous.filter((c) => !current.includes(c));
    return { added, removed };
  }

  clear(): void {
    this.providerCapabilities.clear();
  }
}
