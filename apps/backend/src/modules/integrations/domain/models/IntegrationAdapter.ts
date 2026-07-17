import type { CapabilityType } from "./IntegrationDefinition.js";

export type AdapterStatus = "active" | "inactive" | "beta" | "deprecated";

export interface IntegrationAdapterConfig {
  id: string;
  providerId: string;
  name: string;
  version: string;
  description?: string;
  status: AdapterStatus;
  supportedCapabilities: CapabilityType[];
  config: Record<string, unknown>;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationAdapter {
  private constructor(private readonly data: IntegrationAdapterConfig) {}

  static create(config: Omit<IntegrationAdapterConfig, "isActive" | "createdAt" | "updatedAt">): IntegrationAdapter {
    const now = new Date();
    return new IntegrationAdapter({
      ...config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: IntegrationAdapterConfig): IntegrationAdapter {
    return new IntegrationAdapter(config);
  }

  get id(): string { return this.data.id; }
  get providerId(): string { return this.data.providerId; }
  get name(): string { return this.data.name; }
  get version(): string { return this.data.version; }
  get description(): string | undefined { return this.data.description; }
  get status(): AdapterStatus { return this.data.status; }
  get supportedCapabilities(): CapabilityType[] { return this.data.supportedCapabilities; }
  get config(): Record<string, unknown> { return this.data.config; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  activate(): IntegrationAdapter {
    return IntegrationAdapter.reconstitute({ ...this.data, status: "active", updatedAt: new Date() });
  }

  deactivate(): IntegrationAdapter {
    return IntegrationAdapter.reconstitute({ ...this.data, status: "inactive", isActive: false, updatedAt: new Date() });
  }

  markDeprecated(): IntegrationAdapter {
    return IntegrationAdapter.reconstitute({ ...this.data, status: "deprecated", updatedAt: new Date() });
  }

  supportsCapability(type: CapabilityType): boolean {
    return this.data.supportedCapabilities.includes(type);
  }
}
