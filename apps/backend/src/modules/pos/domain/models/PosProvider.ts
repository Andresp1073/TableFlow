import type { PosCapability } from "./PosCapability.js";

export interface PosProviderConfig {
  id: string;
  name: string;
  displayName: string;
  version: string;
  capabilities: PosCapability[];
  isEnabled: boolean;
  website?: string;
  documentationUrl?: string;
  configurationSchema: Record<string, unknown>;
  metadata?: Record<string, string>;
}

export class PosProvider {
  private constructor(public readonly value: PosProviderConfig) {}

  static create(config: PosProviderConfig): PosProvider {
    if (!config.id.trim()) {
      throw new Error("Provider ID cannot be empty");
    }
    if (!config.name.trim()) {
      throw new Error("Provider name cannot be empty");
    }
    if (!config.displayName.trim()) {
      throw new Error("Provider display name cannot be empty");
    }
    return new PosProvider({ ...config, capabilities: [...config.capabilities] });
  }

  static reconstitute(config: PosProviderConfig): PosProvider {
    return new PosProvider(config);
  }

  equals(other: PosProvider): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get name(): string {
    return this.value.name;
  }

  get displayName(): string {
    return this.value.displayName;
  }

  get version(): string {
    return this.value.version;
  }

  get capabilities(): readonly PosCapability[] {
    return this.value.capabilities;
  }

  get isEnabled(): boolean {
    return this.value.isEnabled;
  }

  get website(): string | undefined {
    return this.value.website;
  }

  get documentationUrl(): string | undefined {
    return this.value.documentationUrl;
  }

  get configurationSchema(): Record<string, unknown> {
    return this.value.configurationSchema;
  }

  get metadata(): Record<string, string> | undefined {
    return this.value.metadata;
  }

  hasCapability(capability: PosCapability): boolean {
    return this.value.capabilities.includes(capability);
  }

  hasAllCapabilities(capabilities: readonly PosCapability[]): boolean {
    return capabilities.every((c) => this.value.capabilities.includes(c));
  }

  enable(): PosProvider {
    return PosProvider.reconstitute({ ...this.value, isEnabled: true });
  }

  disable(): PosProvider {
    return PosProvider.reconstitute({ ...this.value, isEnabled: false });
  }
}
