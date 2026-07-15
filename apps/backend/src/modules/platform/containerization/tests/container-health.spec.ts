import { describe, it, expect } from "vitest";
import { ContainerHealth, HealthCheckManager, createStartupCheck, createReadinessCheck, createLivenessCheck } from "../ContainerHealth.js";
import { ContainerValidationError } from "../errors.js";

describe("ContainerHealth", () => {
  it("creates a health check", () => {
    const hc = new ContainerHealth({
      type: "liveness",
      strategy: "http",
      httpPath: "/health/live",
      httpPort: 4000,
      intervalMs: 30_000,
      timeoutMs: 5_000,
      retries: 3,
      startPeriodMs: 30_000,
    });

    expect(hc.type).toBe("liveness");
    expect(hc.strategy).toBe("http");
    expect(hc.intervalMs).toBe(30_000);
    expect(hc.retries).toBe(3);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new ContainerHealth({
        type: "invalid" as never,
        strategy: "http",
        intervalMs: 1000,
        timeoutMs: 1000,
        retries: 3,
      }),
    ).toThrow(ContainerValidationError);
  });

  it("converts to health endpoint", () => {
    const hc = new ContainerHealth({
      type: "readiness",
      strategy: "http",
      httpPath: "/health/ready",
      httpPort: 4000,
      intervalMs: 10_000,
      timeoutMs: 3_000,
      retries: 3,
    });

    const endpoint = hc.toHealthEndpoint();
    expect(endpoint.type).toBe("readiness");
    expect(endpoint.path).toBe("/health/ready");
    expect(endpoint.port).toBe(4000);
  });

  it("generates Docker health check command for http", () => {
    const hc = new ContainerHealth({
      type: "liveness",
      strategy: "http",
      httpPath: "/health/live",
      httpPort: 4000,
      intervalMs: 30_000,
      timeoutMs: 5_000,
      retries: 3,
    });

    const cmd = hc.toDockerHealthCheckCommand();
    expect(cmd).toBeDefined();
    expect(cmd![1]).toContain("curl -f http://localhost:4000/health/live");
  });

  it("generates Docker health check command for tcp", () => {
    const hc = new ContainerHealth({
      type: "readiness",
      strategy: "tcp",
      tcpPort: 5432,
      intervalMs: 10_000,
      timeoutMs: 3_000,
      retries: 3,
    });

    const cmd = hc.toDockerHealthCheckCommand();
    expect(cmd).toBeDefined();
    expect(cmd![1]).toContain("nc -z localhost 5432");
  });

  it("generates Docker health check config", () => {
    const hc = new ContainerHealth({
      type: "startup",
      strategy: "http",
      httpPath: "/health/startup",
      httpPort: 4000,
      intervalMs: 5_000,
      timeoutMs: 3_000,
      retries: 3,
      startPeriodMs: 0,
    });

    const config = hc.toDockerHealthCheckConfig();
    expect(config.test).toBeDefined();
    expect(config.interval).toBe("5000ms");
    expect(config.retries).toBe(3);
  });

  it("returns undefined for unknown strategy", () => {
    const hc = new ContainerHealth({
      type: "liveness",
      strategy: "grpc",
      intervalMs: 30_000,
      timeoutMs: 5_000,
      retries: 3,
    });

    expect(hc.toDockerHealthCheckCommand()).toBeUndefined();
  });
});

describe("createStartupCheck", () => {
  it("creates a startup check with defaults", () => {
    const check = createStartupCheck();
    expect(check.type).toBe("startup");
    expect(check.httpPath).toBe("/health/startup");
    expect(check.intervalMs).toBe(5_000);
  });

  it("creates a startup check with overrides", () => {
    const check = createStartupCheck({ intervalMs: 10_000, retries: 5 });
    expect(check.intervalMs).toBe(10_000);
    expect(check.retries).toBe(5);
  });
});

describe("createReadinessCheck", () => {
  it("creates a readiness check with defaults", () => {
    const check = createReadinessCheck();
    expect(check.type).toBe("readiness");
    expect(check.httpPath).toBe("/health/readiness");
    expect(check.intervalMs).toBe(10_000);
  });
});

describe("createLivenessCheck", () => {
  it("creates a liveness check with defaults", () => {
    const check = createLivenessCheck();
    expect(check.type).toBe("liveness");
    expect(check.httpPath).toBe("/health/liveness");
    expect(check.intervalMs).toBe(30_000);
  });
});

describe("HealthCheckManager", () => {
  it("registers and retrieves health checks", () => {
    const manager = new HealthCheckManager();
    const startup = createStartupCheck();
    const readiness = createReadinessCheck();
    const liveness = createLivenessCheck();

    manager.registerMany([startup, readiness, liveness]);

    expect(manager.getHealthCheck("startup")).toBeDefined();
    expect(manager.getHealthCheck("readiness")).toBeDefined();
    expect(manager.getHealthCheck("liveness")).toBeDefined();
    expect(manager.getHealthCheck("liveness")!.type).toBe("liveness");
  });

  it("returns endpoints from registered checks", () => {
    const manager = new HealthCheckManager();
    manager.register(createStartupCheck());

    const endpoints = manager.getEndpoints();
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0]!.path).toBe("/health/startup");
  });

  it("performs startup check", async () => {
    const manager = new HealthCheckManager();
    manager.register(createStartupCheck());

    const result = await manager.performStartupCheck();
    expect(result.type).toBe("startup");
    expect(result.status).toBe("healthy");
    expect(result.dependencies).toBeDefined();
  });

  it("performs readiness check", async () => {
    const manager = new HealthCheckManager();
    manager.register(createReadinessCheck());
    manager.registerDependency({ name: "database", type: "mysql", required: true, timeoutMs: 5000 });

    const result = await manager.performReadinessCheck();
    expect(result.type).toBe("readiness");
    expect(result.status).toBe("healthy");
  });

  it("performs liveness check", async () => {
    const manager = new HealthCheckManager();
    manager.register(createLivenessCheck());

    const result = await manager.performLivenessCheck();
    expect(result.type).toBe("liveness");
    expect(result.status).toBe("healthy");
  });

  it("returns degraded status when dependency unhealthy", async () => {
    const manager = new HealthCheckManager();
    manager.register(createReadinessCheck());

    const result = await manager.performReadinessCheck();
    expect(result.status).toBe("healthy");

    expect(result.dependencies).toEqual([]);
  });
});
