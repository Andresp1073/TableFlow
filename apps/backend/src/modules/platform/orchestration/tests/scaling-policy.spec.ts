import { describe, it, expect } from "vitest";
import { ScalingPolicy } from "../ScalingPolicy.js";
import { OrchestrationValidationError } from "../errors.js";

describe("ScalingPolicy", () => {
  it("creates an auto scaling policy", () => {
    const policy = ScalingPolicy.createAutoScaling(2, 10, 80);
    expect(policy.strategy).toBe("auto");
    expect(policy.minReplicas).toBe(2);
    expect(policy.maxReplicas).toBe(10);
    expect(policy.metrics).toHaveLength(1);
    expect(policy.metrics[0]!.type).toBe("cpu");
    expect(policy.metrics[0]!.targetAverageUtilization).toBe(80);
  });

  it("creates a scheduled scaling policy", () => {
    const policy = ScalingPolicy.createScheduled([
      { name: "peak", cronExpression: "0 9 * * 1-5", targetReplicas: 10, timezone: "UTC" },
      { name: "off-peak", cronExpression: "0 18 * * 1-5", targetReplicas: 3, timezone: "UTC" },
    ]);

    expect(policy.strategy).toBe("scheduled");
    expect(policy.schedule).toHaveLength(2);
  });

  it("creates a fixed replica policy", () => {
    const policy = ScalingPolicy.createFixed(5);
    expect(policy.minReplicas).toBe(5);
    expect(policy.maxReplicas).toBe(5);
    expect(policy.targetReplicas).toBe(5);
  });

  it("throws on invalid strategy", () => {
    expect(() =>
      new ScalingPolicy({ strategy: "invalid" as never, minReplicas: 1, maxReplicas: 1, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when min replicas negative", () => {
    expect(() =>
      new ScalingPolicy({ strategy: "horizontal", minReplicas: -1, maxReplicas: 1, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when max < min", () => {
    expect(() =>
      new ScalingPolicy({ strategy: "horizontal", minReplicas: 10, maxReplicas: 1, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when target < min", () => {
    expect(() =>
      new ScalingPolicy({ strategy: "horizontal", minReplicas: 5, maxReplicas: 10, targetReplicas: 2, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws when target > max", () => {
    expect(() =>
      new ScalingPolicy({ strategy: "horizontal", minReplicas: 1, maxReplicas: 5, targetReplicas: 10, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 }),
    ).toThrow(OrchestrationValidationError);
  });

  it("calculates target replicas based on fixed target", () => {
    const policy = ScalingPolicy.createFixed(8);
    expect(policy.calculateTargetReplicas()).toBe(8);
  });

  it("calculates target replicas based on CPU utilization", () => {
    const policy = ScalingPolicy.createAutoScaling(2, 10, 80);
    const target = policy.calculateTargetReplicas(90);
    expect(target).toBeGreaterThanOrEqual(2);
    expect(target).toBeLessThanOrEqual(10);
  });

  it("returns min replicas when no metrics", () => {
    const policy = new ScalingPolicy({ strategy: "horizontal", minReplicas: 3, maxReplicas: 10, cooldownPeriodMs: 0, scaleDownStabilizationMs: 0 });
    expect(policy.calculateTargetReplicas()).toBe(3);
  });

  it("converts to horizontal config", () => {
    const policy = ScalingPolicy.createAutoScaling(2, 10, 80);
    const config = policy.toHorizontalConfig();
    expect(config.minReplicas).toBe(2);
    expect(config.maxReplicas).toBe(10);
    expect(config.targetCpuUtilization).toBe(80);
  });

  it("converts to vertical config", () => {
    const policy = ScalingPolicy.createFixed(3);
    const config = policy.toVerticalConfig();
    expect(config.minCpu).toBe("50m");
    expect(config.maxMemory).toBe("4Gi");
  });
});
