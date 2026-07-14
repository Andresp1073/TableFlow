import { BaseHealthCheck } from "../HealthCheck.js";
import type { HealthCheckResult } from "../../types.js";
import { healthy, unhealthy } from "../HealthStatus.js";

export interface DatabasePingFunction {
  (): Promise<boolean>;
}

export interface DatabaseHealthOptions {
  name?: string;
  ping: DatabasePingFunction;
  timeout?: number;
}

export class DatabaseHealthCheck extends BaseHealthCheck {
  readonly name: string;
  private readonly ping: DatabasePingFunction;
  private readonly timeout: number;

  constructor(options: DatabaseHealthOptions) {
    super();
    this.name = options.name ?? "database";
    this.ping = options.ping;
    this.timeout = options.timeout ?? 5000;
  }

  override async check(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error(`Database ping timed out after ${this.timeout}ms`)), this.timeout);
      });

      const isHealthy = await Promise.race([this.ping(), timeoutPromise]);

      const duration = performance.now() - start;

      if (isHealthy) {
        return healthy(this.name, "Database is reachable", duration, { timeout: this.timeout });
      }

      return unhealthy(this.name, "Database ping returned unhealthy", duration, { timeout: this.timeout });
    } catch (error) {
      const duration = performance.now() - start;

      return unhealthy(this.name, (error as Error).message, duration, { timeout: this.timeout });
    }
  }
}
