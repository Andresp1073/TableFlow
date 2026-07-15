import type {
  HealthCheckConfig,
  HealthCheckType,
  HealthCheckResult,
  HealthDependency,
  HealthDependencyResult,
  HealthEndpoint,
  HealthCheckStrategy,
} from "./types.js";
import { HEALTH_CHECK_TYPES } from "./types.js";
import { ContainerValidationError } from "./errors.js";

export class ContainerHealth {
  readonly type: HealthCheckType;
  readonly strategy: HealthCheckStrategy;
  readonly command?: string[];
  readonly httpPath?: string;
  readonly httpPort?: number;
  readonly tcpPort?: number;
  readonly grpcService?: string;
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly retries: number;
  readonly startPeriodMs: number;

  constructor(config: HealthCheckConfig) {
    if (!HEALTH_CHECK_TYPES.includes(config.type)) {
      throw new ContainerValidationError(`Invalid health check type: ${config.type}`, []);
    }

    this.type = config.type;
    this.strategy = config.strategy;
    this.command = config.command;
    this.httpPath = config.httpPath;
    this.httpPort = config.httpPort;
    this.tcpPort = config.tcpPort;
    this.grpcService = config.grpcService;
    this.intervalMs = config.intervalMs;
    this.timeoutMs = config.timeoutMs;
    this.retries = config.retries;
    this.startPeriodMs = config.startPeriodMs ?? 0;
  }

  toHealthEndpoint(): HealthEndpoint {
    const path = this.httpPath ?? "/health";
    const port = this.httpPort ?? this.tcpPort ?? 3000;

    return {
      type: this.type,
      path,
      port,
      expectedStatus: 200,
    };
  }

  toDockerHealthCheckCommand(): string[] | undefined {
    if (this.strategy === "command" && this.command) {
      return this.command;
    }
    if (this.strategy === "http" && this.httpPath && this.httpPort) {
      return ["CMD-SHELL", `curl -f http://localhost:${this.httpPort}${this.httpPath} || exit 1`];
    }
    if (this.strategy === "tcp" && this.tcpPort) {
      return ["CMD-SHELL", `nc -z localhost ${this.tcpPort} || exit 1`];
    }
    return undefined;
  }

  toDockerHealthCheckConfig(): Record<string, unknown> {
    const test = this.toDockerHealthCheckCommand();
    if (!test) {
      return {};
    }

    return {
      test,
      interval: `${this.intervalMs}ms`,
      timeout: `${this.timeoutMs}ms`,
      retries: this.retries,
      startPeriod: `${this.startPeriodMs}ms`,
    };
  }
}

export class HealthCheckManager {
  private readonly healthChecks: Map<HealthCheckType, ContainerHealth> = new Map();
  private readonly dependencies: Map<string, HealthDependency> = new Map();

  register(healthCheck: ContainerHealth): void {
    this.healthChecks.set(healthCheck.type, healthCheck);
  }

  registerMany(healthChecks: ContainerHealth[]): void {
    for (const hc of healthChecks) {
      this.register(hc);
    }
  }

  registerDependency(dependency: HealthDependency): void {
    this.dependencies.set(dependency.name, dependency);
  }

  getHealthCheck(type: HealthCheckType): ContainerHealth | undefined {
    return this.healthChecks.get(type);
  }

  getEndpoints(): HealthEndpoint[] {
    return Array.from(this.healthChecks.values()).map((hc) => hc.toHealthEndpoint());
  }

  getDependencies(): HealthDependency[] {
    return Array.from(this.dependencies.values());
  }

  async performStartupCheck(): Promise<HealthCheckResult> {
    const check = this.healthChecks.get("startup");
    const startTime = Date.now();

    if (!check) {
      return {
        type: "startup",
        status: "healthy",
        timestamp: new Date().toISOString(),
        durationMs: 0,
        dependencies: [],
      };
    }

    const depResults = await this.checkAllDependencies();
    const failedDeps = depResults.filter((d) => d.status === "unhealthy");
    const requiredFailed = failedDeps.filter((d) => {
      const dep = this.dependencies.get(d.name);
      return dep?.required;
    });

    return {
      type: "startup",
      status: requiredFailed.length > 0 ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      error: requiredFailed.length > 0 ? `Required dependencies unhealthy: ${requiredFailed.map((d) => d.name).join(", ")}` : undefined,
      dependencies: depResults,
    };
  }

  async performReadinessCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const depResults = await this.checkAllDependencies();
    const failedDeps = depResults.filter((d) => d.status === "unhealthy");
    const requiredFailed = failedDeps.filter((d) => {
      const dep = this.dependencies.get(d.name);
      return dep?.required;
    });

    let status: "healthy" | "unhealthy" | "degraded" = "healthy";
    if (requiredFailed.length > 0) {
      status = "unhealthy";
    } else if (failedDeps.length > 0) {
      status = "degraded";
    }

    return {
      type: "readiness",
      status,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      error: requiredFailed.length > 0 ? `Required dependencies unhealthy: ${requiredFailed.map((d) => d.name).join(", ")}` : undefined,
      dependencies: depResults,
    };
  }

  async performLivenessCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const depResults = await this.checkAllDependencies();

    return {
      type: "liveness",
      status: "healthy",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      dependencies: depResults,
    };
  }

  private async checkAllDependencies(): Promise<HealthDependencyResult[]> {
    const results: HealthDependencyResult[] = [];

    for (const [, dependency] of this.dependencies) {
      const depStartTime = Date.now();

      try {
        const healthy = await this.simulateDependencyCheck(dependency);
        results.push({
          name: dependency.name,
          status: healthy ? "healthy" : "unhealthy",
          durationMs: Date.now() - depStartTime,
        });
      } catch {
        results.push({
          name: dependency.name,
          status: "unhealthy",
          durationMs: Date.now() - depStartTime,
          error: "Dependency check failed",
        });
      }
    }

    return results;
  }

  private async simulateDependencyCheck(_dependency: HealthDependency): Promise<boolean> {
    return true;
  }
}

export function createStartupCheck(config?: Partial<HealthCheckConfig>): ContainerHealth {
  return new ContainerHealth({
    type: "startup",
    strategy: "http",
    httpPath: "/health/startup",
    httpPort: 4000,
    intervalMs: config?.intervalMs ?? 5_000,
    timeoutMs: config?.timeoutMs ?? 3_000,
    retries: config?.retries ?? 3,
    startPeriodMs: config?.startPeriodMs ?? 0,
  });
}

export function createReadinessCheck(config?: Partial<HealthCheckConfig>): ContainerHealth {
  return new ContainerHealth({
    type: "readiness",
    strategy: "http",
    httpPath: "/health/readiness",
    httpPort: 4000,
    intervalMs: config?.intervalMs ?? 10_000,
    timeoutMs: config?.timeoutMs ?? 3_000,
    retries: config?.retries ?? 3,
    startPeriodMs: config?.startPeriodMs ?? 5_000,
  });
}

export function createLivenessCheck(config?: Partial<HealthCheckConfig>): ContainerHealth {
  return new ContainerHealth({
    type: "liveness",
    strategy: "http",
    httpPath: "/health/liveness",
    httpPort: 4000,
    intervalMs: config?.intervalMs ?? 30_000,
    timeoutMs: config?.timeoutMs ?? 5_000,
    retries: config?.retries ?? 3,
    startPeriodMs: config?.startPeriodMs ?? 30_000,
  });
}
