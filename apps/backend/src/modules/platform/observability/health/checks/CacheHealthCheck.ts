import { BaseHealthCheck } from "../HealthCheck.js";
import type { HealthCheckResult } from "../../types.js";
import { healthy, unhealthy } from "../HealthStatus.js";

export interface CachePingFunction {
  (): Promise<boolean>;
}

export interface CacheHealthOptions {
  name?: string;
  ping: CachePingFunction;
  timeout?: number;
}

export class CacheHealthCheck extends BaseHealthCheck {
  readonly name: string;
  private readonly ping: CachePingFunction;
  private readonly timeout: number;

  constructor(options: CacheHealthOptions) {
    super();
    this.name = options.name ?? "cache";
    this.ping = options.ping;
    this.timeout = options.timeout ?? 3000;
  }

  override async check(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error(`Cache ping timed out after ${this.timeout}ms`)), this.timeout);
      });

      const isHealthy = await Promise.race([this.ping(), timeoutPromise]);

      const duration = performance.now() - start;

      if (isHealthy) {
        return healthy(this.name, "Cache is reachable", duration, { timeout: this.timeout });
      }

      return unhealthy(this.name, "Cache ping returned unhealthy", duration, { timeout: this.timeout });
    } catch (error) {
      const duration = performance.now() - start;

      return unhealthy(this.name, (error as Error).message, duration, { timeout: this.timeout });
    }
  }
}
