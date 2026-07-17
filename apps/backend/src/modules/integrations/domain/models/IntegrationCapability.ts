import type { CapabilityType, IntegrationCapabilityData } from "./IntegrationDefinition.js";

export type CapabilityCategory = "import" | "export" | "sync" | "event" | "command" | "schedule";

export interface IntegrationCapabilityConfig {
  id: string;
  name: string;
  type: CapabilityType;
  category: CapabilityCategory;
  description?: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class IntegrationCapability {
  private constructor(private readonly config: IntegrationCapabilityConfig) {}

  static create(config: IntegrationCapabilityConfig): IntegrationCapability {
    return new IntegrationCapability(config);
  }

  static reconstitute(config: IntegrationCapabilityConfig): IntegrationCapability {
    return new IntegrationCapability(config);
  }

  get id(): string { return this.config.id; }
  get name(): string { return this.config.name; }
  get type(): CapabilityType { return this.config.type; }
  get category(): CapabilityCategory { return this.config.category; }
  get description(): string | undefined { return this.config.description; }
  get enabled(): boolean { return this.config.enabled; }
  get config(): Record<string, unknown> | undefined { return this.config.config; }

  enable(): IntegrationCapability {
    return IntegrationCapability.reconstitute({ ...this.config, enabled: true });
  }

  disable(): IntegrationCapability {
    return IntegrationCapability.reconstitute({ ...this.config, enabled: false });
  }

  toData(): IntegrationCapabilityData {
    return { type: this.config.type, enabled: this.config.enabled, config: this.config.config };
  }
}
