import { BaseHealthCheck } from "../HealthCheck.js";
import type { HealthCheckResult } from "../../types.js";
import { healthy, unhealthy } from "../HealthStatus.js";

export interface QueuePingFunction {
  (): Promise<boolean>;
}

export interface QueueHealthOptions {
  name?: string;
  ping: QueuePingFunction;
  timeout?: number;
}

export class QueueHealthCheck extends BaseHealthCheck {
  readonly name: string;
  private readonly ping: QueuePingFunction;
  private readonly timeout: number;

  constructor(options: QueueHealthOptions) {
    super();
    this.name = options.name ?? "queue";
    this.ping = options.ping;
    this.timeout = options.timeout ?? 5000;
  }

  override async check(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error(`Queue ping timed out after ${this.timeout}ms`)), this.timeout);
      });

      const isHealthy = await Promise.race([this.ping(), timeoutPromise]);

      const duration = performance.now() - start;

      if (isHealthy) {
        return healthy(this.name, "Queue is reachable", duration, { timeout: this.timeout });
      }

      return unhealthy(this.name, "Queue ping returned unhealthy", duration, { timeout: this.timeout });
    } catch (error) {
      const duration = performance.now() - start;

      return unhealthy(this.name, (error as Error).message, duration, { timeout: this.timeout });
    }
  }
}
