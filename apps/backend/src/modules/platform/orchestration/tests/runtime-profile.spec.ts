import { describe, it, expect } from "vitest";
import { RuntimeProfile } from "../RuntimeProfile.js";
import { OrchestrationValidationError } from "../errors.js";

describe("RuntimeProfile", () => {
  it("creates a runtime profile", () => {
    const profile = new RuntimeProfile({
      name: "backend",
      resources: {
        requests: { cpu: "100m", memory: "128Mi" },
        limits: { cpu: "500m", memory: "512Mi" },
      },
    });

    expect(profile.name).toBe("backend");
    expect(profile.getCpuRequest()).toBe("100m");
    expect(profile.getMemoryLimit()).toBe("512Mi");
  });

  it("throws on empty name", () => {
    expect(() =>
      new RuntimeProfile({ name: "", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "200m", memory: "256Mi" } } }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on missing cpu request", () => {
    expect(() =>
      new RuntimeProfile({ name: "test", resources: { requests: { cpu: "", memory: "128Mi" }, limits: { cpu: "200m", memory: "256Mi" } } }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on missing memory limit", () => {
    expect(() =>
      new RuntimeProfile({ name: "test", resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "200m", memory: "" } } }),
    ).toThrow(OrchestrationValidationError);
  });

  it("creates default profile", () => {
    const profile = RuntimeProfile.createDefault("backend");
    expect(profile.name).toBe("backend");
    expect(profile.getCpuRequest()).toBe("100m");
    expect(profile.getMemoryLimit()).toBe("512Mi");
  });

  it("creates minimal profile", () => {
    const profile = RuntimeProfile.createMinimal("worker");
    expect(profile.getCpuRequest()).toBe("50m");
    expect(profile.getMemoryRequest()).toBe("64Mi");
  });

  it("creates production profile", () => {
    const profile = RuntimeProfile.createProduction("backend");
    expect(profile.name).toBe("backend");
    expect(profile.getCpuRequest()).toBe("250m");
    expect(profile.getMemoryLimit()).toBe("1Gi");
    expect(profile.hasAffinity()).toBe(true);
    expect(profile.topologySpreadConstraints).toHaveLength(1);
  });

  it("detects GPU resources", () => {
    const profile = new RuntimeProfile({
      name: "gpu-worker",
      resources: {
        requests: { cpu: "1", memory: "4Gi" },
        limits: { cpu: "2", memory: "8Gi", gpu: { count: 1, type: "nvidia" } },
      },
    });

    expect(profile.hasGpu()).toBe(true);
  });

  it("detects no GPU resources", () => {
    const profile = RuntimeProfile.createDefault("cpu-worker");
    expect(profile.hasGpu()).toBe(false);
  });

  it("detects tolerations", () => {
    const profile = new RuntimeProfile({
      name: "special",
      resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "200m", memory: "256Mi" } },
      tolerations: [{ key: "gpu", operator: "Exists", effect: "NoSchedule" }],
    });

    expect(profile.hasTolerations()).toBe(true);
  });

  it("detects no tolerations", () => {
    const profile = RuntimeProfile.createDefault("plain");
    expect(profile.hasTolerations()).toBe(false);
  });

  it("accepts node selector", () => {
    const profile = new RuntimeProfile({
      name: "ssd-only",
      resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "200m", memory: "256Mi" } },
      nodeSelector: { disk: "ssd" },
    });

    expect(profile.nodeSelector).toEqual({ disk: "ssd" });
  });
});
