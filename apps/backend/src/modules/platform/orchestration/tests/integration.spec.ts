import { describe, it, expect, vi } from "vitest";
import { DeploymentDefinition } from "../DeploymentDefinition.js";
import { DeploymentManager } from "../DeploymentManager.js";
import { DeploymentStrategyFactory, RollingUpdateStrategy, BlueGreenStrategy, CanaryStrategy, RecreateStrategy } from "../DeploymentStrategy.js";
import { RuntimeProfile } from "../RuntimeProfile.js";
import { ScalingPolicy } from "../ScalingPolicy.js";
import { ServiceDefinition } from "../ServiceDefinition.js";
import { NetworkPolicyDefinition } from "../NetworkPolicyDefinition.js";
import {
  OrchestrationError,
  OrchestrationValidationError,
  OrchestrationNotFoundError,
  DeploymentFailedError,
  ScalingFailedError,
  ProviderNotFoundError,
} from "../errors.js";
import { createOrchestrationEvent, publishOrchestrationEvent } from "../events.js";
import {
  DEPLOYMENT_STRATEGY_TYPES,
  SERVICE_TYPES,
  SCALING_STRATEGY_TYPES,
  ORCHESTRATION_PROVIDER_TYPES,
} from "../types.js";
import type { DeploymentDefinitionConfig } from "../types.js";

describe("Integration - Full Deployment Lifecycle", () => {
  it("deploys a full production deployment with all features", async () => {
    const manager = new DeploymentManager();

    const runtimeProfile = RuntimeProfile.createProduction("backend");
    const scalingPolicy = ScalingPolicy.createAutoScaling(2, 10, 80);
    const serviceDef = ServiceDefinition.createLoadBalancer("backend", 4000, { app: "backend" });
    const networkPolicy = NetworkPolicyDefinition.createAllowSpecificIngress(
      "backend-allow-ingress",
      { matchLabels: { app: "backend" } },
      [{ port: 4000, protocol: "TCP" }],
    );

    const config: DeploymentDefinitionConfig = {
      name: "backend",
      labels: { app: "backend", tier: "api", managed_by: "tableflow" },
      annotations: { "tableflow.dev/owner": "platform-team" },
      replicas: 5,
      strategy: {
        type: "rolling_update",
        rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" },
      },
      runtimeProfile: {
        name: runtimeProfile.name,
        resources: {
          requests: { cpu: runtimeProfile.getCpuRequest(), memory: runtimeProfile.getMemoryRequest() },
          limits: { cpu: runtimeProfile.getCpuLimit(), memory: runtimeProfile.getMemoryLimit() },
        },
        affinity: runtimeProfile.affinity,
        topologySpreadConstraints: [...runtimeProfile.topologySpreadConstraints],
      },
      scalingPolicy: {
        strategy: scalingPolicy.strategy,
        minReplicas: scalingPolicy.minReplicas,
        maxReplicas: scalingPolicy.maxReplicas,
        metrics: [...scalingPolicy.metrics],
        cooldownPeriodMs: scalingPolicy.cooldownPeriodMs,
        scaleDownStabilizationMs: scalingPolicy.scaleDownStabilizationMs,
      },
      serviceDefinition: {
        name: serviceDef.name,
        type: serviceDef.type,
        ports: [...serviceDef.ports],
        selector: { ...serviceDef.selector },
      },
      networkPolicies: [{
        name: networkPolicy.name,
        policyType: networkPolicy.policyType,
        podSelector: { ...networkPolicy.podSelector },
        ingressRules: [...networkPolicy.ingressRules],
        policyTypes: [...networkPolicy.policyTypes],
      }],
      healthCheckPath: "/health/readiness",
      healthCheckPort: 4000,
      revisionHistoryLimit: 5,
      progressDeadlineSeconds: 300,
      minReadySeconds: 10,
      paused: false,
    };

    const result = await manager.deploy(config);
    expect(result.name).toBe("backend");
    expect(result.status).toBe("healthy");
    expect(result.replicas).toBe(5);

    const scaled = await manager.scale("backend", 8);
    expect(scaled.newReplicas).toBe(8);

    const rolled = await manager.rollback("backend");
    expect(rolled.status).toBe("rolled_back");

    const status = await manager.getStatus("backend");
    expect(status.name).toBe("backend");
  });
});

describe("Integration - Network Policies", () => {
  it("creates deny-all ingress policy", () => {
    const policy = NetworkPolicyDefinition.createDenyAllIngress("deny-all", { matchLabels: { app: "backend" } });
    expect(policy.allowsIngress()).toBe(true);
    expect(policy.ingressRules).toHaveLength(0);
  });

  it("creates allow-all ingress policy", () => {
    const policy = NetworkPolicyDefinition.createAllowAllIngress("allow-all", { matchLabels: { app: "backend" } });
    expect(policy.ingressRules).toHaveLength(1);
    expect(policy.ingressRules[0]).toEqual({});
  });

  it("creates isolated policy", () => {
    const policy = NetworkPolicyDefinition.createIsolated("isolated", { matchLabels: { app: "backend" } });
    expect(policy.allowsIngress()).toBe(true);
    expect(policy.allowsEgress()).toBe(true);
    expect(policy.ingressRules).toHaveLength(1);
    expect(policy.egressRules).toHaveLength(1);
  });
});

describe("Integration - Constants and Types", () => {
  it("defines all deployment strategy types", () => {
    expect(DEPLOYMENT_STRATEGY_TYPES).toHaveLength(4);
    expect(DEPLOYMENT_STRATEGY_TYPES).toContain("rolling_update");
    expect(DEPLOYMENT_STRATEGY_TYPES).toContain("blue_green");
    expect(DEPLOYMENT_STRATEGY_TYPES).toContain("canary");
    expect(DEPLOYMENT_STRATEGY_TYPES).toContain("recreate");
  });

  it("defines all service types", () => {
    expect(SERVICE_TYPES).toHaveLength(4);
    expect(SERVICE_TYPES).toContain("internal");
    expect(SERVICE_TYPES).toContain("external");
    expect(SERVICE_TYPES).toContain("load_balanced");
    expect(SERVICE_TYPES).toContain("headless");
  });

  it("defines all scaling strategy types", () => {
    expect(SCALING_STRATEGY_TYPES).toHaveLength(4);
    expect(SCALING_STRATEGY_TYPES).toContain("horizontal");
    expect(SCALING_STRATEGY_TYPES).toContain("vertical");
    expect(SCALING_STRATEGY_TYPES).toContain("auto");
    expect(SCALING_STRATEGY_TYPES).toContain("scheduled");
  });

  it("defines all orchestration provider types", () => {
    expect(ORCHESTRATION_PROVIDER_TYPES).toHaveLength(6);
    expect(ORCHESTRATION_PROVIDER_TYPES).toContain("kubernetes");
    expect(ORCHESTRATION_PROVIDER_TYPES).toContain("openshift");
    expect(ORCHESTRATION_PROVIDER_TYPES).toContain("ecs");
    expect(ORCHESTRATION_PROVIDER_TYPES).toContain("azure_container_apps");
    expect(ORCHESTRATION_PROVIDER_TYPES).toContain("nomad");
    expect(ORCHESTRATION_PROVIDER_TYPES).toContain("google_cloud_run");
  });
});

describe("Integration - Error Classes", () => {
  it("creates orchestration errors with codes", () => {
    const error = new OrchestrationError("Orchestration failed", "ORCH_ERROR");
    expect(error.message).toBe("Orchestration failed");
    expect(error.code).toBe("ORCH_ERROR");
  });

  it("creates validation errors", () => {
    const error = new OrchestrationValidationError("Invalid config", ["Name required"]);
    expect(error.code).toBe("ORCHESTRATION_VALIDATION_ERROR");
    expect(error.validationErrors).toHaveLength(1);
  });

  it("creates not found errors", () => {
    const error = new OrchestrationNotFoundError("deployment", "backend");
    expect(error.resourceType).toBe("deployment");
    expect(error.resourceName).toBe("backend");
  });

  it("creates deployment failed errors", () => {
    const error = new DeploymentFailedError("backend", "Deployment crashed");
    expect(error.deploymentName).toBe("backend");
  });

  it("creates scaling failed errors", () => {
    const error = new ScalingFailedError("backend-policy", "OOM");
    expect(error.policyName).toBe("backend-policy");
  });

  it("creates provider not found errors", () => {
    const error = new ProviderNotFoundError("kubernetes");
    expect(error.providerType).toBe("kubernetes");
    expect(error.message).toContain("kubernetes");
  });
});

describe("Integration - Events", () => {
  it("creates orchestration events", () => {
    const event = createOrchestrationEvent("deployment.started", "backend", { replicas: 3 });
    expect(event.type).toBe("deployment.started");
    expect(event.payload.resourceName).toBe("backend");
    expect(event.payload.replicas).toBe(3);
  });

  it("publishes events silently when no publisher", async () => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), fatal: vi.fn(), log: vi.fn(), child: vi.fn() } as any;
    await publishOrchestrationEvent(undefined, logger, "deployment.completed", "backend");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("defines all event types", () => {
    const eventTypes = [
      "deployment.started",
      "deployment.completed",
      "deployment.failed",
      "deployment.rolled_back",
      "deployment.strategy_changed",
      "scaling.triggered",
      "scaling.completed",
      "scaling.failed",
      "service.created",
      "service.updated",
      "service.deleted",
    ];

    for (const eventType of eventTypes) {
      const event = createOrchestrationEvent(eventType as any, "test");
      expect(event.type).toBe(eventType);
    }
  });
});

describe("Integration - Provider Registration", () => {
  it("registers and retrieves providers", () => {
    const manager = new DeploymentManager();
    const provider = {
      name: "test-provider",
      providerType: "kubernetes" as const,
      deploy: vi.fn(),
      scale: vi.fn(),
      rollback: vi.fn(),
      getStatus: vi.fn(),
      delete: vi.fn(),
    };

    manager.registerProvider(provider);
    expect(manager.getProvider("kubernetes")).toBe(provider);
    expect(manager.getProvider("nomad")).toBeUndefined();
  });
});
