import { describe, it, expect, vi } from "vitest";
import { DeploymentDefinition } from "../DeploymentDefinition.js";
import { DeploymentManager } from "../DeploymentManager.js";
import { DeploymentStrategyFactory, RollingUpdateStrategy, BlueGreenStrategy, CanaryStrategy, RecreateStrategy } from "../DeploymentStrategy.js";
import { OrchestrationValidationError, OrchestrationNotFoundError } from "../errors.js";
import type { DeploymentDefinitionConfig } from "../types.js";

describe("DeploymentDefinition", () => {
  const validConfig: DeploymentDefinitionConfig = {
    name: "backend",
    labels: { app: "backend" },
    annotations: {},
    replicas: 3,
    strategy: {
      type: "rolling_update",
      rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" },
    },
    runtimeProfile: {
      name: "backend-profile",
      resources: {
        requests: { cpu: "100m", memory: "128Mi" },
        limits: { cpu: "500m", memory: "512Mi" },
      },
    },
    scalingPolicy: {
      strategy: "auto",
      minReplicas: 2,
      maxReplicas: 10,
      cooldownPeriodMs: 300_000,
      scaleDownStabilizationMs: 300_000,
      metrics: [{ type: "cpu", targetAverageUtilization: 80 }],
    },
    paused: false,
  };

  it("creates a valid deployment definition", () => {
    const def = new DeploymentDefinition(validConfig);
    expect(def.name).toBe("backend");
    expect(def.replicas).toBe(3);
    expect(def.strategy.type).toBe("rolling_update");
  });

  it("throws on empty name", () => {
    expect(() =>
      new DeploymentDefinition({ ...validConfig, name: "" }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on negative replicas", () => {
    expect(() =>
      new DeploymentDefinition({ ...validConfig, replicas: -1 }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on invalid strategy type", () => {
    expect(() =>
      new DeploymentDefinition({ ...validConfig, strategy: { type: "invalid" as never } }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when rolling update config missing", () => {
    expect(() =>
      new DeploymentDefinition({
        ...validConfig,
        strategy: { type: "rolling_update" },
      }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when blue/green config missing", () => {
    expect(() =>
      new DeploymentDefinition({
        ...validConfig,
        strategy: { type: "blue_green" },
      }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when canary config missing", () => {
    expect(() =>
      new DeploymentDefinition({
        ...validConfig,
        strategy: { type: "canary" },
      }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when recreate config missing", () => {
    expect(() =>
      new DeploymentDefinition({
        ...validConfig,
        strategy: { type: "recreate" },
      }),
    ).toThrow(OrchestrationValidationError);
  });

  it("sets default namespace", () => {
    const def = new DeploymentDefinition(validConfig);
    expect(def.namespace).toBe("default");
  });

  it("uses provided namespace", () => {
    const def = new DeploymentDefinition({ ...validConfig, namespace: "production" });
    expect(def.namespace).toBe("production");
  });

  it("converts to config", () => {
    const def = new DeploymentDefinition(validConfig);
    const config = def.toConfig();
    expect(config.name).toBe("backend");
    expect(config.replicas).toBe(3);
  });
});

describe("DeploymentManager", () => {
  it("deploys a rolling update", async () => {
    const manager = new DeploymentManager();
    const result = await manager.deploy({
      name: "backend",
      labels: { app: "backend" },
      annotations: {},
      replicas: 3,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "bp", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 3, maxReplicas: 3, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    expect(result.name).toBe("backend");
    expect(result.strategy).toBe("rolling_update");
    expect(result.status).toBe("healthy");
    expect(result.id).toBeDefined();
  });

  it("deploys a blue/green strategy", async () => {
    const manager = new DeploymentManager();
    const result = await manager.deploy({
      name: "frontend",
      labels: { app: "frontend" },
      annotations: {},
      replicas: 5,
      strategy: { type: "blue_green", blueGreen: { previewServiceName: "frontend-preview", activeServiceName: "frontend-active", autoPromote: true, promoteDelayMs: 300_000 } },
      runtimeProfile: { name: "fp", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 5, maxReplicas: 5, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    expect(result.strategy).toBe("blue_green");
    expect(result.status).toBe("healthy");
  });

  it("deploys a canary strategy", async () => {
    const manager = new DeploymentManager();
    const result = await manager.deploy({
      name: "api",
      labels: { app: "api" },
      annotations: {},
      replicas: 10,
      strategy: { type: "canary", canary: { steps: [{ weight: 10, pauseMs: 60_000 }, { weight: 50, pauseMs: 120_000 }], trafficMirroring: false, analysisDurationMs: 300_000 } },
      runtimeProfile: { name: "ap", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 10, maxReplicas: 10, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    expect(result.strategy).toBe("canary");
    expect(result.status).toBe("healthy");
  });

  it("deploys a recreate strategy", async () => {
    const manager = new DeploymentManager();
    const result = await manager.deploy({
      name: "worker",
      labels: { app: "worker" },
      annotations: {},
      replicas: 2,
      strategy: { type: "recreate", recreate: { maxShutdownTimeMs: 30_000 } },
      runtimeProfile: { name: "wp", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 2, maxReplicas: 2, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    expect(result.strategy).toBe("recreate");
    expect(result.status).toBe("healthy");
  });

  it("scales a deployment", async () => {
    const manager = new DeploymentManager();
    await manager.deploy({
      name: "scalable",
      labels: { app: "scalable" },
      annotations: {},
      replicas: 2,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "sp", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "auto", minReplicas: 2, maxReplicas: 10, cooldownPeriodMs: 300_000, scaleDownStabilizationMs: 300_000 },
      paused: false,
    });

    const result = await manager.scale("scalable", 5);
    expect(result.previousReplicas).toBe(2);
    expect(result.newReplicas).toBe(5);
    expect(result.status).toBe("healthy");
  });

  it("rolls back a deployment", async () => {
    const manager = new DeploymentManager();
    await manager.deploy({
      name: "rollback-me",
      labels: { app: "rollback" },
      annotations: {},
      replicas: 3,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "rp", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 3, maxReplicas: 3, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    const result = await manager.rollback("rollback-me");
    expect(result.status).toBe("rolled_back");
  });

  it("gets deployment status", async () => {
    const manager = new DeploymentManager();
    await manager.deploy({
      name: "status-check",
      labels: { app: "status" },
      annotations: {},
      replicas: 1,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "sc", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 1, maxReplicas: 1, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    const status = await manager.getStatus("status-check");
    expect(status.name).toBe("status-check");
    expect(status.status).toBe("healthy");
  });

  it("throws on getting unknown deployment", async () => {
    const manager = new DeploymentManager();
    await expect(manager.getStatus("unknown")).rejects.toThrow(OrchestrationNotFoundError);
  });

  it("deletes a deployment", async () => {
    const manager = new DeploymentManager();
    await manager.deploy({
      name: "delete-me",
      labels: { app: "delete" },
      annotations: {},
      replicas: 1,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "dp", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 1, maxReplicas: 1, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    await manager.delete("delete-me");
    await expect(manager.getStatus("delete-me")).rejects.toThrow();
  });

  it("lists deployments", async () => {
    const manager = new DeploymentManager();
    await manager.deploy({
      name: "list-1",
      labels: { app: "list" },
      annotations: {},
      replicas: 1,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "l1", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 1, maxReplicas: 1, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    const list = await manager.list();
    expect(list.length).toBeGreaterThan(0);
  });

  it("publishes deployment lifecycle events", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) {
        events.push(event.type);
      },
      async publishMany() {},
    };

    const manager = new DeploymentManager({ eventPublisher: publisher });

    await manager.deploy({
      name: "event-test",
      labels: { app: "event" },
      annotations: {},
      replicas: 2,
      strategy: { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } },
      runtimeProfile: { name: "et", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } } },
      scalingPolicy: { strategy: "horizontal", minReplicas: 2, maxReplicas: 2, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 },
      paused: false,
    });

    expect(events).toContain("deployment.started");
    expect(events).toContain("deployment.completed");
  });
});

describe("DeploymentStrategyFactory", () => {
  it("returns rolling update strategy", () => {
    const strategy = DeploymentStrategyFactory.getStrategy("rolling_update");
    expect(strategy).toBeInstanceOf(RollingUpdateStrategy);
    expect(strategy.name).toBe("Rolling Update");
  });

  it("returns blue/green strategy", () => {
    const strategy = DeploymentStrategyFactory.getStrategy("blue_green");
    expect(strategy).toBeInstanceOf(BlueGreenStrategy);
    expect(strategy.description).toContain("blue");
  });

  it("returns canary strategy", () => {
    const strategy = DeploymentStrategyFactory.getStrategy("canary");
    expect(strategy).toBeInstanceOf(CanaryStrategy);
  });

  it("returns recreate strategy", () => {
    const strategy = DeploymentStrategyFactory.getStrategy("recreate");
    expect(strategy).toBeInstanceOf(RecreateStrategy);
  });

  it("lists all strategies", () => {
    const strategies = DeploymentStrategyFactory.listStrategies();
    expect(strategies).toHaveLength(4);
  });

  it("validates rolling update strategy", () => {
    const strategy = new RollingUpdateStrategy();
    const errors = strategy.validate({ type: "rolling_update" });
    expect(errors.length).toBeGreaterThan(0);

    const valid = strategy.validate({ type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } });
    expect(valid).toHaveLength(0);
  });

  it("validates blue/green strategy", () => {
    const strategy = new BlueGreenStrategy();
    const errors = strategy.validate({ type: "blue_green" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("validates canary strategy", () => {
    const strategy = new CanaryStrategy();
    const errors = strategy.validate({ type: "canary" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("validates recreate strategy", () => {
    const strategy = new RecreateStrategy();
    const errors = strategy.validate({ type: "recreate" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("executes rolling update", async () => {
    const strategy = new RollingUpdateStrategy();
    const result = await strategy.execute("test", 3, { type: "rolling_update", rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" } });
    expect(result.status).toBe("healthy");
    expect(result.replicas).toBe(3);
  });
});
