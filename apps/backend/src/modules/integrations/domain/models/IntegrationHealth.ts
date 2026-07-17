export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface IntegrationHealthConfig {
  id: string;
  integrationId: string;
  restaurantId: string;
  status: HealthStatus;
  responseTimeMs: number;
  lastCheckedAt: Date;
  message?: string;
  details: Record<string, unknown>;
  checks: HealthCheck[];
  isOnline: boolean;
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  responseTimeMs: number;
  message?: string;
}

export class IntegrationHealth {
  private constructor(private readonly config: IntegrationHealthConfig) {}

  static create(config: Omit<IntegrationHealthConfig, "lastCheckedAt">): IntegrationHealth {
    return new IntegrationHealth({ ...config, lastCheckedAt: new Date() });
  }

  static reconstitute(config: IntegrationHealthConfig): IntegrationHealth {
    return new IntegrationHealth(config);
  }

  get id(): string { return this.config.id; }
  get integrationId(): string { return this.config.integrationId; }
  get restaurantId(): string { return this.config.restaurantId; }
  get status(): HealthStatus { return this.config.status; }
  get responseTimeMs(): number { return this.config.responseTimeMs; }
  get lastCheckedAt(): Date { return this.config.lastCheckedAt; }
  get message(): string | undefined { return this.config.message; }
  get details(): Record<string, unknown> { return this.config.details; }
  get checks(): HealthCheck[] { return this.config.checks; }
  get isOnline(): boolean { return this.config.isOnline; }

  isHealthy(): boolean {
    return this.config.status === "healthy";
  }

  allChecksPassed(): boolean {
    return this.config.checks.every((c) => c.status === "healthy");
  }

  failedChecks(): HealthCheck[] {
    return this.config.checks.filter((c) => c.status !== "healthy");
  }
}
