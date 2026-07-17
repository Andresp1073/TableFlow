export type IntegrationType =
  | "erp"
  | "crm"
  | "pos"
  | "accounting"
  | "payments"
  | "marketing"
  | "messaging"
  | "analytics"
  | "identity"
  | "custom";

export type IntegrationStatus = "draft" | "configured" | "connected" | "disconnected" | "failed" | "archived";

export interface IntegrationDefinitionConfig {
  id: string;
  restaurantId: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  providerId: string;
  adapterId?: string;
  capabilities: IntegrationCapabilityData[];
  config: Record<string, unknown>;
  version: number;
  isActive: boolean;
  tags: string[];
  errorMessage?: string;
  lastRunAt?: Date;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CapabilityType = "data_import" | "data_export" | "synchronization" | "events" | "commands" | "scheduled_execution";

export interface IntegrationCapabilityData {
  type: CapabilityType;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export class IntegrationDefinition {
  private constructor(private readonly data: IntegrationDefinitionConfig) {}

  static create(config: Omit<IntegrationDefinitionConfig, "status" | "version" | "isActive" | "createdAt" | "updatedAt">): IntegrationDefinition {
    const now = new Date();
    return new IntegrationDefinition({
      ...config,
      status: "draft",
      version: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: IntegrationDefinitionConfig): IntegrationDefinition {
    return new IntegrationDefinition(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get type(): IntegrationType { return this.data.type; }
  get status(): IntegrationStatus { return this.data.status; }
  get providerId(): string { return this.data.providerId; }
  get adapterId(): string | undefined { return this.data.adapterId; }
  get capabilities(): IntegrationCapabilityData[] { return this.data.capabilities; }
  get config(): Record<string, unknown> { return this.data.config; }
  get version(): number { return this.data.version; }
  get isActive(): boolean { return this.data.isActive; }
  get tags(): string[] { return this.data.tags; }
  get errorMessage(): string | undefined { return this.data.errorMessage; }
  get lastRunAt(): Date | undefined { return this.data.lastRunAt; }
  get createdBy(): string { return this.data.createdBy; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  configure(adapterId: string, capabilities: IntegrationCapabilityData[], config: Record<string, unknown>): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      status: "configured",
      adapterId,
      capabilities,
      config,
      updatedAt: new Date(),
    });
  }

  connect(): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      status: "connected",
      errorMessage: undefined,
      updatedAt: new Date(),
    });
  }

  disconnect(): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      status: "disconnected",
      updatedAt: new Date(),
    });
  }

  fail(errorMessage: string): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      status: "failed",
      errorMessage,
      updatedAt: new Date(),
    });
  }

  archive(): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      status: "archived",
      isActive: false,
      updatedAt: new Date(),
    });
  }

  markRun(): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      lastRunAt: new Date(),
      updatedAt: new Date(),
    });
  }

  hasCapability(type: CapabilityType): boolean {
    return this.data.capabilities.some((c) => c.type === type && c.enabled);
  }

  isRunnable(): boolean {
    return this.data.status === "connected" && this.data.isActive;
  }

  createVersion(): IntegrationDefinition {
    return IntegrationDefinition.reconstitute({
      ...this.data,
      version: this.data.version + 1,
      updatedAt: new Date(),
    });
  }
}
