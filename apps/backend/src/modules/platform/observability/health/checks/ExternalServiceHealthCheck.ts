import { BaseHealthCheck } from "../HealthCheck.js";
import type { HealthCheckResult } from "../../types.js";
import { healthy, degraded, unhealthy } from "../HealthStatus.js";

export interface ExternalServicePingFunction {
  (): Promise<{ reachable: boolean; latency?: number }>;
}

export interface ExternalServiceHealthOptions {
  name: string;
  ping: ExternalServicePingFunction;
  timeout?: number;
  degradationThresholdMs?: number;
}

export class ExternalServiceHealthCheck extends BaseHealthCheck {
  readonly name: string;
  private readonly ping: ExternalServicePingFunction;
  private readonly timeout: number;
  private readonly degradationThresholdMs: number;

  constructor(options: ExternalServiceHealthOptions) {
    super();
    this.name = options.name;
    this.ping = options.ping;
    this.timeout = options.timeout ?? 10000;
    this.degradationThresholdMs = options.degradationThresholdMs ?? 2000;
  }

  override async check(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      const timeoutPromise = new Promise<{ reachable: boolean }>((_, reject) => {
        setTimeout(() => reject(new Error(`External service "${this.name}" timed out after ${this.timeout}ms`)), this.timeout);
      });

      const result = await Promise.race([this.ping(), timeoutPromise]);

      const duration = performance.now() - start;

      if (!result.reachable) {
        return unhealthy(this.name, `External service "${this.name}" is not reachable`, duration);
      }

      if (result.latency !== undefined && result.latency > this.degradationThresholdMs) {
        return degraded(
          this.name,
          `External service "${this.name}" latency (${result.latency}ms) exceeds threshold (${this.degradationThresholdMs}ms)`,
          duration,
          { latency: result.latency, threshold: this.degradationThresholdMs },
        );
      }

      return healthy(this.name, `External service "${this.name}" is reachable`, duration, {
        latency: result.latency,
      });
    } catch (error) {
      const duration = performance.now() - start;

      return unhealthy(this.name, (error as Error).message, duration);
    }
  }
}
