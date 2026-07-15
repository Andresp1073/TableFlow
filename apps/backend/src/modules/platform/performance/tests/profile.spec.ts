import { describe, it, expect } from "vitest";
import { PerformanceProfileBuilder } from "../PerformanceProfile.js";
import { PerformanceValidationError } from "../errors.js";

describe("PerformanceProfileBuilder", () => {
  it("creates a default profile", () => {
    const builder = PerformanceProfileBuilder.createDefault("test-service");
    const profile = builder.build();

    expect(profile.name).toBe("test-service");
    expect(profile.executionTime.avgMs).toBe(0);
    expect(profile.resourceUsage.cpuPercent).toBe(0);
    expect(profile.concurrency.activeThreads).toBe(0);
    expect(profile.dependencies).toHaveLength(0);
    expect(profile.historicalTrends.observationCount).toBe(0);
  });

  it("creates a profile with custom configuration", () => {
    const profile = new PerformanceProfileBuilder({
      name: "api-gateway",
      executionTime: { avgMs: 150, p95Ms: 300, p99Ms: 500, p50Ms: 120, minMs: 50, maxMs: 2000 },
      resourceUsage: { cpuPercent: 45, memoryMb: 512, memoryPercent: 55, ioReadBytes: 1000, ioWriteBytes: 500, networkRxBytes: 8000, networkTxBytes: 2000, labels: { region: "us-east" } },
      concurrency: { activeThreads: 10, pendingTasks: 3, queueDepth: 5, poolUtilization: 0.75 },
      dependencies: [
        { name: "database", avgLatencyMs: 5, p99LatencyMs: 50, errorRate: 0.01, requestRate: 100 },
        { name: "cache", avgLatencyMs: 2, p99LatencyMs: 10, errorRate: 0.001, requestRate: 500 },
      ],
      historicalTrends: { throughputTrend: 5, latencyTrend: -2, errorRateTrend: -0.1, observationCount: 1000, windowMs: 3600000 },
      labels: { service: "api", version: "1.0" },
    }).build();

    expect(profile.name).toBe("api-gateway");
    expect(profile.executionTime.avgMs).toBe(150);
    expect(profile.executionTime.p95Ms).toBe(300);
    expect(profile.resourceUsage.cpuPercent).toBe(45);
    expect(profile.resourceUsage.labels.region).toBe("us-east");
    expect(profile.concurrency.activeThreads).toBe(10);
    expect(profile.dependencies).toHaveLength(2);
    expect(profile.historicalTrends.throughputTrend).toBe(5);
    expect(profile.labels.service).toBe("api");
  });

  it("throws on empty name", () => {
    expect(() => new PerformanceProfileBuilder({ name: "" })).toThrow(PerformanceValidationError);
    expect(() => new PerformanceProfileBuilder({ name: "  " })).toThrow(PerformanceValidationError);
  });

  it("builds from an existing profile", () => {
    const original = new PerformanceProfileBuilder({
      name: "original",
      executionTime: { avgMs: 100, p50Ms: 90, p95Ms: 200, p99Ms: 300, minMs: 10, maxMs: 500 },
      resourceUsage: { cpuPercent: 30, memoryMb: 256, memoryPercent: 40, ioReadBytes: 500, ioWriteBytes: 200, networkRxBytes: 4000, networkTxBytes: 1000, labels: {} },
      concurrency: { activeThreads: 5, pendingTasks: 1, queueDepth: 2, poolUtilization: 0.5 },
      labels: { env: "prod" },
    }).build();

    const rebuilt = PerformanceProfileBuilder.fromProfile(original).build();

    expect(rebuilt.name).toBe("original");
    expect(rebuilt.executionTime.avgMs).toBe(100);
    expect(rebuilt.executionTime.p95Ms).toBe(200);
  });

  it("freezes dependencies array", () => {
    const profile = new PerformanceProfileBuilder({
      name: "frozen-test",
      dependencies: [
        { name: "db", avgLatencyMs: 10, p99LatencyMs: 100, errorRate: 0.01, requestRate: 50 },
      ],
    }).build();

    expect(Object.isFrozen(profile.dependencies)).toBe(true);
  });
});
