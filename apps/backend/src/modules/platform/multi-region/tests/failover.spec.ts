import { describe, it, expect } from "vitest";
import {
  AutomaticFailoverPolicy,
  ManualFailoverPolicy,
  createFailoverPolicy,
} from "../FailoverPolicy.js";
import type { FailoverConfig, FailoverStep } from "../types.js";
import { MultiRegionValidationError } from "../errors.js";

describe("FailoverPolicy", () => {
  const steps: FailoverStep[] = [
    { name: "drain_traffic", action: "Drain traffic from source", timeoutMs: 30000, order: 1, required: true },
    { name: "sync_data", action: "Sync pending data", timeoutMs: 60000, order: 2, required: true },
    { name: "switch_dns", action: "Switch DNS to target", timeoutMs: 30000, order: 3, required: true },
    { name: "verify_health", action: "Verify target health", timeoutMs: 30000, order: 4, required: false },
  ];

  const autoConfig: FailoverConfig = {
    id: "failover-us-east-to-west",
    type: "automatic",
    sourceRegionId: "us-east",
    targetRegionId: "us-west",
    trigger: { type: "health_threshold", condition: "error_rate > 0.05", threshold: 0.05 },
    autoRollback: true,
    rollbackDelayMs: 300000,
    steps,
  };

  const manualConfig: FailoverConfig = {
    id: "failover-manual-eu",
    type: "manual",
    sourceRegionId: "eu-west",
    targetRegionId: "eu-central",
    trigger: { type: "manual" },
    autoRollback: false,
    rollbackDelayMs: 0,
    steps,
  };

  it("automatic failover validates and executes", async () => {
    const policy = new AutomaticFailoverPolicy();
    const execution = await policy.execute(autoConfig);

    expect(execution.configId).toBe("failover-us-east-to-west");
    expect(execution.state).toBe("completed");
    expect(execution.steps).toHaveLength(4);
    expect(execution.id).toBeDefined();
  });

  it("manual failover validates and executes", async () => {
    const policy = new ManualFailoverPolicy();
    const execution = await policy.execute(manualConfig);

    expect(execution.configId).toBe("failover-manual-eu");
    expect(execution.state).toBe("completed");
    expect(execution.steps).toHaveLength(4);
  });

  it("returns validation errors for invalid config", () => {
    const policy = new AutomaticFailoverPolicy();
    const invalidConfig: FailoverConfig = {
      id: "",
      type: "automatic",
      sourceRegionId: "",
      targetRegionId: "",
      trigger: { type: "manual" },
      autoRollback: false,
      rollbackDelayMs: 0,
      steps: [],
    };

    const errors = policy.validate(invalidConfig);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it("validates source and target are different", () => {
    const policy = new AutomaticFailoverPolicy();
    const sameRegion: FailoverConfig = {
      id: "invalid", type: "automatic",
      sourceRegionId: "us-east", targetRegionId: "us-east",
      trigger: { type: "manual" }, autoRollback: false, rollbackDelayMs: 0,
      steps: [{ name: "step1", action: "test", timeoutMs: 1000, order: 1, required: true }],
    };

    const errors = policy.validate(sameRegion);
    expect(errors).toContain("Source and target regions must be different");
  });

  it("performs rollback on execution", async () => {
    const policy = new AutomaticFailoverPolicy();
    const execution = await policy.execute(autoConfig);

    const rollback = await policy.rollback(execution);
    expect(rollback.state).toBe("rollback");
    expect(rollback.steps.length).toBeGreaterThanOrEqual(1);
  });

  it("throws on invalid config execution", async () => {
    const policy = new AutomaticFailoverPolicy();
    const invalidConfig = { ...autoConfig, id: "" };

    await expect(policy.execute(invalidConfig)).rejects.toThrow(MultiRegionValidationError);
  });

  it("factory creates correct policies", () => {
    expect(createFailoverPolicy("automatic")).toBeInstanceOf(AutomaticFailoverPolicy);
    expect(createFailoverPolicy("manual")).toBeInstanceOf(ManualFailoverPolicy);
  });
});
