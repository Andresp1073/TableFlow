export enum PosEnvironment {
  Sandbox = "sandbox",
  Production = "production",
}

export interface PosContextConfig {
  connectionId: string;
  providerId: string;
  restaurantId: string;
  branchId?: string;
  environment: PosEnvironment;
  settings: Record<string, string>;
}

export class PosContext {
  private constructor(public readonly value: PosContextConfig) {}

  static create(config: PosContextConfig): PosContext {
    if (!config.connectionId.trim()) {
      throw new Error("Connection ID cannot be empty");
    }
    if (!config.providerId.trim()) {
      throw new Error("Provider ID cannot be empty");
    }
    if (!config.restaurantId.trim()) {
      throw new Error("Restaurant ID cannot be empty");
    }
    return new PosContext({ ...config, settings: { ...config.settings } });
  }

  static reconstitute(config: PosContextConfig): PosContext {
    return new PosContext(config);
  }

  equals(other: PosContext): boolean {
    return this.value.connectionId === other.value.connectionId;
  }

  get connectionId(): string {
    return this.value.connectionId;
  }

  get providerId(): string {
    return this.value.providerId;
  }

  get restaurantId(): string {
    return this.value.restaurantId;
  }

  get branchId(): string | undefined {
    return this.value.branchId;
  }

  get environment(): PosEnvironment {
    return this.value.environment;
  }

  get settings(): Record<string, string> {
    return { ...this.value.settings };
  }

  isSandbox(): boolean {
    return this.value.environment === PosEnvironment.Sandbox;
  }

  isProduction(): boolean {
    return this.value.environment === PosEnvironment.Production;
  }

  withSetting(key: string, value: string): PosContext {
    return PosContext.create({
      ...this.value,
      settings: { ...this.value.settings, [key]: value },
    });
  }
}
