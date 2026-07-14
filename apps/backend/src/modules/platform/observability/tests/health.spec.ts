import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationHealthCheck } from "../health/checks/ApplicationHealthCheck.js";
import { DatabaseHealthCheck } from "../health/checks/DatabaseHealthCheck.js";
import { CacheHealthCheck } from "../health/checks/CacheHealthCheck.js";
import { QueueHealthCheck } from "../health/checks/QueueHealthCheck.js";
import { ExternalServiceHealthCheck } from "../health/checks/ExternalServiceHealthCheck.js";
import { HealthAggregator } from "../health/HealthAggregator.js";
import { healthy, degraded, unhealthy, aggregateHealthStatus } from "../health/HealthStatus.js";
import type { HealthCheckResult, HealthCheck } from "../types.js";

describe("HealthStatus helpers", () => {
  it("healthy() creates a healthy result", () => {
    const result = healthy("app", "running", 10, { version: "1.0" });

    expect(result.status).toBe("healthy");
    expect(result.component).toBe("app");
    expect(result.message).toBe("running");
    expect(result.duration).toBe(10);
    expect(result.metadata).toEqual({ version: "1.0" });
  });

  it("degraded() creates a degraded result", () => {
    const result = degraded("db", "slow queries", 500);

    expect(result.status).toBe("degraded");
    expect(result.component).toBe("db");
    expect(result.message).toBe("slow queries");
    expect(result.duration).toBe(500);
  });

  it("unhealthy() creates an unhealthy result", () => {
    const result = unhealthy("cache", "connection refused", 100);

    expect(result.status).toBe("unhealthy");
    expect(result.component).toBe("cache");
    expect(result.error).toBe("connection refused");
    expect(result.duration).toBe(100);
  });
});

describe("aggregateHealthStatus", () => {
  it("returns healthy when all checks pass", () => {
    const results: HealthCheckResult[] = [
      healthy("app", "ok"),
      healthy("db", "ok"),
    ];

    const status = aggregateHealthStatus(results);

    expect(status.status).toBe("healthy");
    expect(status.checks).toHaveLength(2);
  });

  it("returns degraded when any check is degraded", () => {
    const results: HealthCheckResult[] = [
      healthy("app", "ok"),
      degraded("db", "slow"),
    ];

    const status = aggregateHealthStatus(results);

    expect(status.status).toBe("degraded");
  });

  it("returns unhealthy when any check is unhealthy", () => {
    const results: HealthCheckResult[] = [
      healthy("app", "ok"),
      unhealthy("db", "down"),
    ];

    const status = aggregateHealthStatus(results);

    expect(status.status).toBe("unhealthy");
  });

  it("includes timestamp and totalDuration", () => {
    const results: HealthCheckResult[] = [healthy("app", "ok")];

    const status = aggregateHealthStatus(results);

    expect(status.timestamp).toBeDefined();
    expect(status.totalDuration).toBeGreaterThanOrEqual(0);
  });
});

describe("ApplicationHealthCheck", () => {
  it("returns healthy with metadata", async () => {
    const check = new ApplicationHealthCheck({ name: "my-app", version: "1.2.3" });
    const result = await check.check();

    expect(result.status).toBe("healthy");
    expect(result.component).toBe("my-app");
    expect(result.metadata?.version).toBe("1.2.3");
    expect(result.metadata?.status).toBe("running");
  });

  it("includes memory info when enabled", async () => {
    const check = new ApplicationHealthCheck({ memory: true });
    const result = await check.check();

    expect(result.metadata?.memory).toBeDefined();
  });

  it("excludes memory info when disabled", async () => {
    const check = new ApplicationHealthCheck({ memory: false });
    const result = await check.check();

    expect(result.metadata?.memory).toBeUndefined();
  });

  it("includes uptime when enabled", async () => {
    const check = new ApplicationHealthCheck({ uptime: true });
    const result = await check.check();

    expect(typeof result.metadata?.uptime).toBe("number");
  });
});

describe("DatabaseHealthCheck", () => {
  it("returns healthy when ping succeeds", async () => {
    const check = new DatabaseHealthCheck({
      ping: async () => true,
    });

    const result = await check.check();

    expect(result.status).toBe("healthy");
    expect(result.component).toBe("database");
  });

  it("returns unhealthy when ping returns false", async () => {
    const check = new DatabaseHealthCheck({
      ping: async () => false,
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
  });

  it("returns unhealthy when ping throws", async () => {
    const check = new DatabaseHealthCheck({
      ping: async () => {
        throw new Error("connection failed");
      },
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
    expect(result.error).toContain("connection failed");
  });

  it("returns unhealthy on timeout", async () => {
    const check = new DatabaseHealthCheck({
      ping: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));

        return true;
      },
      timeout: 10,
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
    expect(result.error).toContain("timed out");
  });
});

describe("CacheHealthCheck", () => {
  it("returns healthy when ping succeeds", async () => {
    const check = new CacheHealthCheck({
      ping: async () => true,
    });

    const result = await check.check();

    expect(result.status).toBe("healthy");
    expect(result.component).toBe("cache");
  });

  it("returns unhealthy when ping fails", async () => {
    const check = new CacheHealthCheck({
      ping: async () => false,
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
  });
});

describe("QueueHealthCheck", () => {
  it("returns healthy when ping succeeds", async () => {
    const check = new QueueHealthCheck({
      ping: async () => true,
    });

    const result = await check.check();

    expect(result.status).toBe("healthy");
    expect(result.component).toBe("queue");
  });

  it("returns unhealthy when ping fails", async () => {
    const check = new QueueHealthCheck({
      ping: async () => false,
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
  });
});

describe("ExternalServiceHealthCheck", () => {
  it("returns healthy when reachable with low latency", async () => {
    const check = new ExternalServiceHealthCheck({
      name: "payment-gateway",
      ping: async () => ({ reachable: true, latency: 100 }),
      degradationThresholdMs: 500,
    });

    const result = await check.check();

    expect(result.status).toBe("healthy");
  });

  it("returns degraded when latency exceeds threshold", async () => {
    const check = new ExternalServiceHealthCheck({
      name: "payment-gateway",
      ping: async () => ({ reachable: true, latency: 1000 }),
      degradationThresholdMs: 500,
    });

    const result = await check.check();

    expect(result.status).toBe("degraded");
    expect(result.message).toContain("latency");
  });

  it("returns unhealthy when not reachable", async () => {
    const check = new ExternalServiceHealthCheck({
      name: "payment-gateway",
      ping: async () => ({ reachable: false }),
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
  });

  it("returns unhealthy on timeout", async () => {
    const check = new ExternalServiceHealthCheck({
      name: "slow-service",
      ping: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));

        return { reachable: true };
      },
      timeout: 10,
    });

    const result = await check.check();

    expect(result.status).toBe("unhealthy");
  });
});

describe("HealthAggregator", () => {
  it("registers and runs health checks", async () => {
    const aggregator = new HealthAggregator();

    aggregator.register(new ApplicationHealthCheck({ name: "app" }));
    aggregator.register(
      new DatabaseHealthCheck({
        ping: async () => true,
      }),
    );

    const results = await aggregator.checkAll();

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe("healthy");
    expect(results[1]?.status).toBe("healthy");
  });

  it("handles a check that throws", async () => {
    const aggregator = new HealthAggregator();
    const failing: HealthCheck = {
      name: "failing-check",
      check: async () => {
        throw new Error("unexpected crash");
      },
    };

    aggregator.register(failing);

    const results = await aggregator.checkAll();

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("unhealthy");
    expect(results[0]?.error).toBe("unexpected crash");
  });

  it("unregisters checks", async () => {
    const aggregator = new HealthAggregator();

    aggregator.register(new ApplicationHealthCheck({ name: "app" }));
    aggregator.unregister("app");

    const results = await aggregator.checkAll();

    expect(results).toHaveLength(0);
  });

  it("checkAllGrouped groups by status", async () => {
    const aggregator = new HealthAggregator();

    aggregator.register(new ApplicationHealthCheck({ name: "app" }));
    aggregator.register(
      new DatabaseHealthCheck({
        ping: async () => {
          throw new Error("down");
        },
      }),
    );

    const grouped = await aggregator.checkAllGrouped();

    expect(grouped.healthy).toHaveLength(1);
    expect(grouped.unhealthy).toHaveLength(1);
    expect(grouped.degraded).toBeUndefined();
  });

  it("getStatus returns overall status", async () => {
    const aggregator = new HealthAggregator();

    aggregator.register(new ApplicationHealthCheck({ name: "app" }));

    const status = await aggregator.getStatus();

    expect(status.status).toBe("healthy");
    expect(status.checks).toHaveLength(1);
    expect(status.timestamp).toBeDefined();
  });
});
