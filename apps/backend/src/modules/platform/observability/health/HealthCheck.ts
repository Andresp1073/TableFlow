import type { HealthCheck as HealthCheckInterface, HealthCheckResult } from "../types.js";

export abstract class BaseHealthCheck implements HealthCheckInterface {
  abstract readonly name: string;
  abstract check(): Promise<HealthCheckResult>;
}
