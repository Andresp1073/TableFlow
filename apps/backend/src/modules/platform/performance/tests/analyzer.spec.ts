import { describe, it, expect } from "vitest";
import { PerformanceAnalyzerImpl } from "../PerformanceAnalyzer.js";
import type { PerformanceMetric } from "../types.js";
import { PerformanceValidationError } from "../errors.js";

describe("PerformanceAnalyzerImpl", () => {
  const analyzer = new PerformanceAnalyzerImpl();

  it("analyzes latency metric within thresholds", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 150, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results).toHaveLength(1);
    expect(results[0]!.severity).toBe("medium");
    expect(results[0]!.metric.value).toBe(150);
  });

  it("flags critical latency above critical threshold", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 1500, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("critical");
  });

  it("flags high latency above warning threshold", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 500, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("high");
  });

  it("analyzes throughput metric with inverse threshold logic", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "requests_per_sec", type: "throughput", value: 30, unit: "rps", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("critical");
  });

  it("flags throughput below warning as high", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "requests_per_sec", type: "throughput", value: 75, unit: "rps", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("high");
  });

  it("returns info for healthy throughput", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "requests_per_sec", type: "throughput", value: 200, unit: "rps", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("info");
  });

  it("analyzes high CPU usage", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "cpu_usage", type: "cpu", value: 95, unit: "%", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("critical");
  });

  it("analyzes moderate memory usage", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "memory_usage", type: "memory", value: 50, unit: "%", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("medium");
  });

  it("analyzes high I/O", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "disk_io", type: "io", value: 90, unit: "%", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("critical");
  });

  it("analyzes network latency", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "network_rtt", type: "network_latency", value: 300, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.severity).toBe("high");
  });

  it("accepts custom thresholds via options", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 300, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const results = await analyzer.analyze(metrics, {
      thresholds: { latency: { warning: 500, critical: 2000 } },
    });
    expect(results[0]!.severity).toBe("medium");
  });

  it("throws on empty metrics array", async () => {
    await expect(analyzer.analyze([])).rejects.toThrow(PerformanceValidationError);
  });

  it("throws on invalid analysis type", async () => {
    const metrics = [
      { name: "custom", type: "invalid" as any, value: 100, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    await expect(analyzer.analyze(metrics)).rejects.toThrow(PerformanceValidationError);
  });

  it("returns default thresholds", () => {
    const thresholds = analyzer.getDefaultThresholds();
    expect(thresholds.latency.warning).toBe(200);
    expect(thresholds.latency.critical).toBe(1000);
    expect(thresholds.cpu.warning).toBe(70);
    expect(thresholds.memory.critical).toBe(90);
  });

  it("builds detailed messages and details", async () => {
    const metrics: PerformanceMetric[] = [
      { name: "db_query", type: "latency", value: 1200, unit: "ms", timestamp: new Date(), labels: { db: "primary" }, source: "postgres" },
    ];
    const results = await analyzer.analyze(metrics);
    expect(results[0]!.message).toContain("Critical latency");
    expect(results[0]!.details.length).toBeGreaterThanOrEqual(5);
    expect(results[0]!.details.some((d) => d.includes("postgres"))).toBe(true);
  });
});
