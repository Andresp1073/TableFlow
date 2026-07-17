export type ConnectionStatus = "connected" | "disconnected" | "failed" | "pending" | "expired";
export type AuthType = "api_key" | "oauth2" | "basic" | "bearer" | "custom";

export interface ConnectionProfileConfig {
  id: string;
  integrationId: string;
  restaurantId: string;
  name: string;
  authType: AuthType;
  credentialsRef: string;
  status: ConnectionStatus;
  baseUrl?: string;
  lastConnectedAt?: Date;
  lastHealthCheckAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ConnectionProfile {
  private constructor(private readonly config: ConnectionProfileConfig) {}

  static create(config: Omit<ConnectionProfileConfig, "status" | "retryCount" | "createdAt" | "updatedAt">): ConnectionProfile {
    const now = new Date();
    return new ConnectionProfile({
      ...config,
      status: "pending",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: ConnectionProfileConfig): ConnectionProfile {
    return new ConnectionProfile(config);
  }

  get id(): string { return this.config.id; }
  get integrationId(): string { return this.config.integrationId; }
  get restaurantId(): string { return this.config.restaurantId; }
  get name(): string { return this.config.name; }
  get authType(): AuthType { return this.config.authType; }
  get credentialsRef(): string { return this.config.credentialsRef; }
  get status(): ConnectionStatus { return this.config.status; }
  get baseUrl(): string | undefined { return this.config.baseUrl; }
  get lastConnectedAt(): Date | undefined { return this.config.lastConnectedAt; }
  get lastHealthCheckAt(): Date | undefined { return this.config.lastHealthCheckAt; }
  get errorMessage(): string | undefined { return this.config.errorMessage; }
  get retryCount(): number { return this.config.retryCount; }
  get maxRetries(): number { return this.config.maxRetries; }
  get createdAt(): Date { return this.config.createdAt; }
  get updatedAt(): Date { return this.config.updatedAt; }

  connect(): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      status: "connected",
      lastConnectedAt: new Date(),
      errorMessage: undefined,
      updatedAt: new Date(),
    });
  }

  disconnect(): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      status: "disconnected",
      updatedAt: new Date(),
    });
  }

  fail(errorMessage: string): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      status: "failed",
      errorMessage,
      updatedAt: new Date(),
    });
  }

  expire(): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      status: "expired",
      updatedAt: new Date(),
    });
  }

  recordHealthCheck(): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      lastHealthCheckAt: new Date(),
      updatedAt: new Date(),
    });
  }

  incrementRetry(): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      retryCount: this.config.retryCount + 1,
      updatedAt: new Date(),
    });
  }

  resetRetries(): ConnectionProfile {
    return ConnectionProfile.reconstitute({
      ...this.config,
      retryCount: 0,
      updatedAt: new Date(),
    });
  }

  canRetry(): boolean {
    return this.config.retryCount < this.config.maxRetries;
  }

  isConnected(): boolean {
    return this.config.status === "connected";
  }
}
