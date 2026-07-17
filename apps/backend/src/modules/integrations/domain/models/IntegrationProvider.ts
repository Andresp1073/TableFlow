import type { IntegrationType } from "./IntegrationDefinition.js";

export type ProviderStatus = "active" | "inactive" | "deprecated";

export interface IntegrationProviderConfig {
  id: string;
  name: string;
  type: IntegrationType;
  version: string;
  description?: string;
  baseUrl?: string;
  docsUrl?: string;
  status: ProviderStatus;
  supportedCapabilities: string[];
  configSchema: Record<string, unknown>;
  authTypes: string[];
  isActive: boolean;
  priority: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationProvider {
  private constructor(private readonly config: IntegrationProviderConfig) {}

  static create(config: Omit<IntegrationProviderConfig, "isActive" | "createdAt" | "updatedAt">): IntegrationProvider {
    const now = new Date();
    return new IntegrationProvider({
      ...config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: IntegrationProviderConfig): IntegrationProvider {
    return new IntegrationProvider(config);
  }

  get id(): string { return this.config.id; }
  get name(): string { return this.config.name; }
  get type(): IntegrationType { return this.config.type; }
  get version(): string { return this.config.version; }
  get description(): string | undefined { return this.config.description; }
  get baseUrl(): string | undefined { return this.config.baseUrl; }
  get docsUrl(): string | undefined { return this.config.docsUrl; }
  get status(): ProviderStatus { return this.config.status; }
  get supportedCapabilities(): string[] { return this.config.supportedCapabilities; }
  get configSchema(): Record<string, unknown> { return this.config.configSchema; }
  get authTypes(): string[] { return this.config.authTypes; }
  get isActive(): boolean { return this.config.isActive; }
  get priority(): number { return this.config.priority; }
  get createdAt(): Date { return this.config.createdAt; }
  get updatedAt(): Date { return this.config.updatedAt; }

  activate(): IntegrationProvider {
    return IntegrationProvider.reconstitute({ ...this.config, status: "active", updatedAt: new Date() });
  }

  deactivate(): IntegrationProvider {
    return IntegrationProvider.reconstitute({ ...this.config, status: "inactive", isActive: false, updatedAt: new Date() });
  }

  markDeprecated(): IntegrationProvider {
    return IntegrationProvider.reconstitute({ ...this.config, status: "deprecated", updatedAt: new Date() });
  }

  supportsCapability(capability: string): boolean {
    return this.config.supportedCapabilities.includes(capability);
  }

  supportsAuthType(authType: string): boolean {
    return this.config.authTypes.includes(authType);
  }
}
