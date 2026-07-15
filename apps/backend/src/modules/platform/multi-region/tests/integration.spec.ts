import { describe, it, expect, vi } from "vitest";
import { RegionManager } from "../RegionManager.js";
import { RegionContext } from "../RegionContext.js";
import { DisasterRecoveryProfile } from "../DisasterRecoveryProfile.js";
import type { FailoverConfig, FailoverStep, ReplicationConfig } from "../types.js";
import {
  MultiRegionError,
  MultiRegionValidationError,
  RegionNotFoundError,
  RegionInactiveError,
  FailoverInProgressError,
  FailoverExecutionError,
  ReplicationError,
  DisasterRecoveryError,
} from "../errors.js";
import { createMultiRegionEvent, publishMultiRegionEvent } from "../events.js";
import {
  REGION_ROLES,
  ROUTING_STRATEGY_TYPES,
  REPLICATION_MODES,
} from "../types.js";

describe("RegionManager", () => {
  it("registers and retrieves regions", () => {
    const manager = new RegionManager();
    const region = manager.registerRegion({
      id: "us-east", name: "US East", role: "primary",
      priority: 100, weight: 100, latitude: 37, longitude: -122,
      tags: ["prod"], capabilities: ["read", "write"],
    });

    expect(manager.getRegion("us-east")).toBeDefined();
    expect(manager.getRegionOrThrow("us-east").id).toBe("us-east");
    expect(() => manager.getRegionOrThrow("unknown")).toThrow(RegionNotFoundError);
  });

  it("lists regions filtered by role", () => {
    const manager = new RegionManager();
    manager.registerRegion(RegionContext.createPrimary("us-east", "US East", 37, -122).config);
    manager.registerRegion(RegionContext.createSecondary("us-west", "US West", 34, -118).config);
    manager.registerRegion(RegionContext.createReadOnly("eu-west", "EU West", 51, -0.1).config);

    expect(manager.listRegions()).toHaveLength(3);
    expect(manager.listRegions("primary")).toHaveLength(1);
    expect(manager.listRegions("read_only")).toHaveLength(1);
  });

  it("updates region health", () => {
    const manager = new RegionManager();
    manager.registerRegion(RegionContext.createPrimary("us-east", "US East", 37, -122).config);

    manager.updateRegionHealth("us-east", { latencyMs: 42, errorRate: 0.005 });
    const region = manager.getRegion("us-east")!;
    expect(region.getHealth().latencyMs).toBe(42);
  });

  it("sets region status and publishes events", () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) { events.push(event.type); },
      async publishMany() {},
    };

    const manager = new RegionManager({ eventPublisher: publisher });
    manager.registerRegion(RegionContext.createPrimary("us-east", "US East", 37, -122).config);

    manager.setRegionStatus("us-east", "inactive");
    expect(manager.getRegion("us-east")!.status).toBe("inactive");
    expect(events).toContain("region.deactivated");

    manager.setRegionStatus("us-east", "active");
    expect(events).toContain("region.activated");
  });

  it("resolves routes using routing rules", () => {
    const manager = new RegionManager();
    manager.registerRegion(RegionContext.createPrimary("us-east", "US East", 37, -122).config);
    manager.registerRegion(RegionContext.createSecondary("us-west", "US West", 34, -118).config);

    manager.addRoutingRule({
      name: "main-rule",
      strategy: "priority",
      conditions: [],
      targets: [
        { regionId: "us-east", weight: 60, priority: 100, active: true },
        { regionId: "us-west", weight: 40, priority: 50, active: true },
      ],
      fallbackRegionId: "us-west",
      enabled: true,
    });

    const decision = manager.resolveRoute("main-rule");
    expect(decision.selectedRegionId).toBe("us-east");
    expect(decision.alternatives).toHaveLength(2);
  });

  it("executes failover", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) { events.push(event.type); },
      async publishMany() {},
    };

    const manager = new RegionManager({ eventPublisher: publisher });

    const steps: FailoverStep[] = [
      { name: "drain", action: "Drain", timeoutMs: 100, order: 1, required: true },
      { name: "switch", action: "Switch", timeoutMs: 100, order: 2, required: true },
    ];

    manager.registerFailoverConfig({
      id: "failover-east-to-west",
      type: "automatic",
      sourceRegionId: "us-east",
      targetRegionId: "us-west",
      trigger: { type: "manual" },
      autoRollback: true,
      rollbackDelayMs: 300000,
      steps,
    });

    const execution = await manager.executeFailover("failover-east-to-west");
    expect(execution.state).toBe("completed");
    expect(events).toContain("failover.started");
    expect(events).toContain("failover.completed");
  });

  it("registers and checks replication status", () => {
    const manager = new RegionManager();

    const config: ReplicationConfig = {
      id: "repl-east-to-west",
      sourceRegionId: "us-east",
      targetRegionId: "us-west",
      mode: "synchronous",
      rpoTargetMs: 1000,
      batched: false,
      batchSize: 100,
      batchIntervalMs: 1000,
      retryPolicy: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
      conflictResolution: { type: "lww" },
      enabled: true,
    };

    manager.registerReplicationConfig(config);
    const status = manager.getReplicationStatus("repl-east-to-west");
    expect(status).toBeDefined();
    expect(status!.healthy).toBe(true);

    expect(manager.getReplicationStatus("unknown")).toBeUndefined();
  });

  it("checks replication health for all configs", () => {
    const manager = new RegionManager();

    manager.registerReplicationConfig({
      id: "repl-1", sourceRegionId: "us-east", targetRegionId: "us-west",
      mode: "synchronous", rpoTargetMs: 1000,
      batched: false, batchSize: 100, batchIntervalMs: 1000,
      retryPolicy: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
      conflictResolution: { type: "lww" }, enabled: true,
    });

    manager.registerReplicationConfig({
      id: "repl-2", sourceRegionId: "us-east", targetRegionId: "eu-west",
      mode: "asynchronous", rpoTargetMs: 5000,
      batched: false, batchSize: 100, batchIntervalMs: 1000,
      retryPolicy: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
      conflictResolution: { type: "lww" }, enabled: true,
    });

    const statuses = manager.checkReplicationHealth();
    expect(statuses).toHaveLength(2);
  });

  it("manages DR profile lifecycle", async () => {
    const manager = new RegionManager();

    const result = manager.registerDisasterRecoveryProfile({
      name: "production-dr",
      description: "Production DR plan",
      rtoSeconds: 300,
      rpoSeconds: 60,
      primaryRegionId: "us-east",
      backupRegionIds: ["us-west", "eu-west"],
      recoveryPriority: 100,
      validationSteps: ["check_dns", "verify_data", "test_connection"],
      autoFailover: true,
      notificationChannels: ["ops@example.com"],
      tags: { environment: "production" },
    });

    expect(result.name).toBe("production-dr");
    expect(result.rtoSeconds).toBe(300);
    expect(result.validated).toBe(false);

    const validated = manager.markDrProfileValidated("production-dr");
    expect(validated!.validated).toBe(true);
    expect(validated!.lastValidatedAt).toBeDefined();

    const drExecution = await manager.executeDisasterRecovery("production-dr", "us-west");
    expect(drExecution.state).toBe("completed");
    expect(drExecution.sourceRegionId).toBe("us-east");
    expect(drExecution.targetRegionId).toBe("us-west");
  });

  it("provides routing targets from active regions", () => {
    const manager = new RegionManager();
    manager.registerRegion(RegionContext.createPrimary("us-east", "US East", 37, -122).config);
    manager.registerRegion(RegionContext.createSecondary("us-west", "US West", 34, -118).config);

    const targets = manager.getRoutingTargets();
    expect(targets).toHaveLength(2);
    expect(targets.every((t) => t.active)).toBe(true);
  });

  it("performs DR drill and marks it", () => {
    const manager = new RegionManager();
    manager.registerDisasterRecoveryProfile({
      name: "dr-plan", description: "DR plan",
      rtoSeconds: 600, rpoSeconds: 120,
      primaryRegionId: "us-east", backupRegionIds: ["us-west"],
      recoveryPriority: 50,
      validationSteps: ["step1"],
      autoFailover: false,
      notificationChannels: [],
      tags: {},
    });

    const drilled = manager.markDrDrillPerformed("dr-plan");
    expect(drilled!.lastDrillAt).toBeDefined();
  });
});

describe("Integration - Error Classes", () => {
  it("creates multi-region errors with codes", () => {
    const error = new MultiRegionError("Region failed", "MR_ERROR");
    expect(error.message).toBe("Region failed");
    expect(error.code).toBe("MR_ERROR");
  });

  it("creates validation errors", () => {
    const error = new MultiRegionValidationError("Invalid config", ["ID required"]);
    expect(error.validationErrors).toHaveLength(1);
  });

  it("creates region not found errors", () => {
    const error = new RegionNotFoundError("us-east");
    expect(error.regionId).toBe("us-east");
  });

  it("creates region inactive errors", () => {
    const error = new RegionInactiveError("us-east", "offline");
    expect(error.status).toBe("offline");
  });

  it("creates failover in progress errors", () => {
    const error = new FailoverInProgressError("f-123");
    expect(error.failoverId).toBe("f-123");
  });

  it("creates failover execution errors", () => {
    const error = new FailoverExecutionError("f-123", "drain", "Timeout");
    expect(error.stepName).toBe("drain");
  });

  it("creates replication errors", () => {
    const error = new ReplicationError("repl-1", "us-east", "us-west", "Lag too high");
    expect(error.sourceRegionId).toBe("us-east");
  });

  it("creates DR errors", () => {
    const error = new DisasterRecoveryError("prod", "RTO exceeded");
    expect(error.profileName).toBe("prod");
  });
});

describe("Integration - Events", () => {
  it("creates multi-region events", () => {
    const event = createMultiRegionEvent("region.activated", "us-east", { role: "primary" });
    expect(event.type).toBe("region.activated");
    expect(event.payload.resourceName).toBe("us-east");
  });

  it("publishes events silently when no publisher", async () => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), fatal: vi.fn(), log: vi.fn(), child: vi.fn() } as any;
    await publishMultiRegionEvent(undefined, logger, "failover.started", "test");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("defines all event types", () => {
    const eventTypes = [
      "region.activated",
      "region.deactivated",
      "failover.started",
      "failover.completed",
      "replication.issue_detected",
      "disaster_recovery.initiated",
    ];
    for (const et of eventTypes) {
      const event = createMultiRegionEvent(et as any, "test");
      expect(event.type).toBe(et);
    }
  });
});

describe("Integration - Constants", () => {
  it("defines all region roles", () => {
    expect(REGION_ROLES).toHaveLength(5);
    expect(REGION_ROLES).toContain("disaster_recovery");
    expect(REGION_ROLES).toContain("maintenance");
  });

  it("defines all routing strategy types", () => {
    expect(ROUTING_STRATEGY_TYPES).toHaveLength(5);
    expect(ROUTING_STRATEGY_TYPES).toContain("geo");
    expect(ROUTING_STRATEGY_TYPES).toContain("manual");
  });

  it("defines all replication modes", () => {
    expect(REPLICATION_MODES).toHaveLength(4);
    expect(REPLICATION_MODES).toContain("synchronous");
    expect(REPLICATION_MODES).toContain("read_replicas");
  });
});
