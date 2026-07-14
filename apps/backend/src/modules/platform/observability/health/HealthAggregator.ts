import type {
  HealthCheck as HealthCheckInterface,
  HealthCheckResult,
  HealthAggregator as HealthAggregatorInterface,
  OverallHealthStatus,
} from "../types.js";
import { aggregateHealthStatus } from "./HealthStatus.js";

export class HealthAggregator implements HealthAggregatorInterface {
  private readonly checks = new Map<string, HealthCheckInterface>();

  register(check: HealthCheckInterface): void {
    this.checks.set(check.name, check);
  }

  unregister(name: string): void {
    this.checks.delete(name);
  }

  async checkAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const check of this.checks.values()) {
      try {
        const result = await check.check();

        results.push(result);
      } catch (error) {
        results.push({
          status: "unhealthy",
          component: check.name,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
          duration: 0,
        });
      }
    }

    return results;
  }

  async checkAllGrouped(): Promise<Record<string, HealthCheckResult[]>> {
    const results = await this.checkAll();
    const grouped: Record<string, HealthCheckResult[]> = {};

    for (const result of results) {
      if (!grouped[result.status]) {
        grouped[result.status] = [];
      }

      grouped[result.status]!.push(result);
    }

    return grouped;
  }

  async getStatus(): Promise<OverallHealthStatus> {
    const results = await this.checkAll();

    return aggregateHealthStatus(results);
  }
}
