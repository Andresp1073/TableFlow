import { describe, it, expect, vi } from "vitest";
import {
  PerformanceError,
  PerformanceValidationError,
  PerformanceNotFoundError,
  AnalysisError,
  BottleneckDetectionError,
  OptimizationError,
} from "../errors.js";
import { createPerformanceEvent, publishPerformanceEvent } from "../events.js";
import {
  ANALYSIS_TYPES,
  BOTTLENECK_TYPES,
  OPTIMIZATION_AREAS,
} from "../types.js";

describe("Integration - Error Classes", () => {
  it("creates performance errors with codes", () => {
    const error = new PerformanceError("Performance failed", "PERF_ERROR");
    expect(error.message).toBe("Performance failed");
    expect(error.code).toBe("PERF_ERROR");
  });

  it("creates validation errors", () => {
    const error = new PerformanceValidationError("Invalid config", ["Name required"]);
    expect(error.code).toBe("PERFORMANCE_VALIDATION_ERROR");
    expect(error.validationErrors).toHaveLength(1);
  });

  it("creates not found errors", () => {
    const error = new PerformanceNotFoundError("profile", "api-gateway");
    expect(error.resourceName).toBe("api-gateway");
    expect(error.resourceType).toBe("profile");
  });

  it("creates analysis errors", () => {
    const error = new AnalysisError("latency", "Analysis failed");
    expect(error.analysisType).toBe("latency");
  });

  it("creates bottleneck detection errors", () => {
    const error = new BottleneckDetectionError("slow_operation", "Detection failed");
    expect(error.bottleneckType).toBe("slow_operation");
  });

  it("creates optimization errors", () => {
    const error = new OptimizationError("caching", "Optimization failed");
    expect(error.optimizationArea).toBe("caching");
  });
});

describe("Integration - Events", () => {
  it("creates performance events", () => {
    const event = createPerformanceEvent("performance.issue_detected", "api_response", { value: 95 });
    expect(event.type).toBe("performance.issue_detected");
    expect(event.payload.resourceName).toBe("api_response");
    expect(event.payload.value).toBe(95);
  });

  it("publishes events silently when no publisher", async () => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), fatal: vi.fn(), log: vi.fn(), child: vi.fn() } as any;
    await publishPerformanceEvent(undefined, logger, "optimization.suggested", "test");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("defines all event types", () => {
    const eventTypes = [
      "performance.issue_detected",
      "optimization.suggested",
      "optimization.applied",
      "performance.threshold_exceeded",
    ];
    for (const et of eventTypes) {
      const event = createPerformanceEvent(et as any, "test");
      expect(event.type).toBe(et);
    }
  });
});

describe("Integration - Constants and Types", () => {
  it("defines all analysis types", () => {
    expect(ANALYSIS_TYPES).toHaveLength(6);
    expect(ANALYSIS_TYPES).toContain("latency");
    expect(ANALYSIS_TYPES).toContain("throughput");
    expect(ANALYSIS_TYPES).toContain("network_latency");
  });

  it("defines all bottleneck types", () => {
    expect(BOTTLENECK_TYPES).toHaveLength(6);
    expect(BOTTLENECK_TYPES).toContain("slow_operation");
    expect(BOTTLENECK_TYPES).toContain("resource_contention");
    expect(BOTTLENECK_TYPES).toContain("long_running_task");
  });

  it("defines all optimization areas", () => {
    expect(OPTIMIZATION_AREAS).toHaveLength(7);
    expect(OPTIMIZATION_AREAS).toContain("caching");
    expect(OPTIMIZATION_AREAS).toContain("parallel_execution");
    expect(OPTIMIZATION_AREAS).toContain("asynchronous_execution");
  });
});
