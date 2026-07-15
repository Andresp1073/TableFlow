import { describe, it, expect } from "vitest";
import { BottleneckDetectorImpl } from "../BottleneckDetector.js";
import type { AnalysisResult } from "../types.js";
import { PerformanceValidationError } from "../errors.js";

describe("BottleneckDetectorImpl", () => {
  const detector = new BottleneckDetectorImpl();

  function makeResult(
    name: string,
    type: string,
    value: number,
    severity: "critical" | "high" | "medium" | "low" | "info",
  ): AnalysisResult {
    return {
      metric: {
        name,
        type: type as any,
        value,
        unit: "ms",
        timestamp: new Date(),
        labels: {},
      },
      threshold: { warning: 100, critical: 500 },
      severity,
      message: `${severity} ${type}: ${name}`,
      details: [`Value: ${value}`, `Type: ${type}`],
    };
  }

  it("detects high latency bottleneck", () => {
    const results = [makeResult("api_response", "latency", 600, "critical")];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks).toHaveLength(1);
    expect(bottlenecks[0]!.type).toBe("high_latency");
    expect(bottlenecks[0]!.severity).toBe("critical");
    expect(bottlenecks[0]!.resource).toBe("api_response");
  });

  it("detects resource contention from high CPU", () => {
    const results = [makeResult("cpu_usage", "cpu", 95, "critical")];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks).toHaveLength(1);
    expect(bottlenecks[0]!.type).toBe("resource_contention");
  });

  it("detects queue saturation from low throughput", () => {
    const results = [makeResult("requests_per_sec", "throughput", 20, "high")];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks).toHaveLength(1);
    expect(bottlenecks[0]!.type).toBe("queue_saturation");
  });

  it("returns empty array for non-critical results below threshold", () => {
    const results = [makeResult("api_response", "latency", 50, "info")];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks).toHaveLength(0);
  });

  it("detects multiple bottlenecks from multiple results", () => {
    const results = [
      makeResult("api_response", "latency", 600, "critical"),
      makeResult("cpu_usage", "cpu", 95, "critical"),
      makeResult("disk_io", "io", 50, "medium"),
    ];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks.length).toBeGreaterThanOrEqual(2);
    expect(bottlenecks.some((b) => b.type === "high_latency")).toBe(true);
    expect(bottlenecks.some((b) => b.type === "resource_contention")).toBe(true);
  });

  it("assigns suggested optimizations per bottleneck type", () => {
    const results = [makeResult("api_response", "latency", 600, "critical")];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks[0]!.suggestedOptimizations).toContain("caching");
    expect(bottlenecks[0]!.suggestedOptimizations).toContain("compression");
  });

  it("generates bottleneck ID and timestamps", () => {
    const results = [makeResult("api", "latency", 600, "critical")];
    const bottlenecks = detector.detect(results);
    expect(bottlenecks[0]!.id).toBeDefined();
    expect(bottlenecks[0]!.id.length).toBeGreaterThan(0);
    expect(bottlenecks[0]!.detectedAt).toBeInstanceOf(Date);
  });

  it("throws on empty analysis array", () => {
    expect(() => detector.detect([])).toThrow(PerformanceValidationError);
  });

  it("uses custom thresholds when configured", () => {
    const customDetector = new BottleneckDetectorImpl({ high_latency: 100 });
    const results = [makeResult("api", "latency", 150, "medium")];
    const bottlenecks = customDetector.detect(results);
    expect(bottlenecks).toHaveLength(1);
  });

  it("provides default thresholds for all bottleneck types", () => {
    const thresholds = detector.getDefaultThresholds();
    expect(thresholds.slow_operation).toBe(1000);
    expect(thresholds.resource_contention).toBe(80);
    expect(thresholds.high_latency).toBe(500);
    expect(thresholds.queue_saturation).toBe(100);
    expect(thresholds.cache_inefficiency).toBe(30);
    expect(thresholds.long_running_task).toBe(30000);
  });
});
