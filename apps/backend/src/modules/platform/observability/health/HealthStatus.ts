import type { HealthCheckResult, HealthStatusType, OverallHealthStatus } from "../types.js";

export function aggregateHealthStatus(results: HealthCheckResult[]): OverallHealthStatus {
  const startTime = performance.now();

  const hasUnhealthy = results.some((r) => r.status === "unhealthy");
  const hasDegraded = results.some((r) => r.status === "degraded");

  let status: HealthStatusType;

  if (hasUnhealthy) {
    status = "unhealthy";
  } else if (hasDegraded) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  const totalDuration = performance.now() - startTime;

  return {
    status,
    checks: results,
    timestamp: new Date().toISOString(),
    totalDuration,
  };
}

export function healthy(component: string, message?: string, duration?: number, metadata?: Record<string, unknown>): HealthCheckResult {
  return {
    status: "healthy",
    component,
    message,
    timestamp: new Date().toISOString(),
    duration: duration ?? 0,
    metadata,
  };
}

export function degraded(component: string, message: string, duration?: number, metadata?: Record<string, unknown>): HealthCheckResult {
  return {
    status: "degraded",
    component,
    message,
    timestamp: new Date().toISOString(),
    duration: duration ?? 0,
    metadata,
  };
}

export function unhealthy(component: string, error: string, duration?: number, metadata?: Record<string, unknown>): HealthCheckResult {
  return {
    status: "unhealthy",
    component,
    error,
    timestamp: new Date().toISOString(),
    duration: duration ?? 0,
    metadata,
  };
}
