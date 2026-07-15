import { describe, it, expect, vi } from "vitest";
import { AlertPolicy } from "../AlertPolicy.js";
import { AlertEngine } from "../AlertEngine.js";
import { MonitoringValidationError } from "../errors.js";

describe("AlertPolicy", () => {
  it("creates a threshold alert", () => {
    const policy = AlertPolicy.createThreshold("high-cpu", "cpu_usage", 90, "critical");
    expect(policy.name).toBe("high-cpu");
    expect(policy.type).toBe("threshold");
    expect(policy.severity).toBe("critical");
    expect(policy.threshold).toBe(90);
  });

  it("evaluates above-threshold firing", () => {
    const policy = AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high");
    const result = policy.evaluate(95);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("firing");
    expect(result!.value).toBe(95);
  });

  it("does not fire when below threshold", () => {
    const policy = AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high");
    const result = policy.evaluate(50);
    expect(result).toBeNull();
  });

  it("respects cooldown period", () => {
    const policy = AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high");
    policy.evaluate(95);
    const secondResult = policy.evaluate(96);
    expect(secondResult).toBeNull();
  });

  it("creates availability alert with below condition", () => {
    const policy = AlertPolicy.createAvailability("availability", "uptime", 99.9, "critical");
    expect(policy.type).toBe("availability");
    expect(policy.condition).toBe("below");
  });

  it("creates latency alert", () => {
    const policy = AlertPolicy.createLatency("p99-latency", "http_request_duration_ms", 500, "high");
    expect(policy.type).toBe("latency");
    expect(policy.threshold).toBe(500);
  });

  it("creates error rate alert", () => {
    const policy = AlertPolicy.createErrorRate("5xx-rate", "http_5xx_rate", 1, "critical");
    expect(policy.type).toBe("error_rate");
    expect(policy.threshold).toBe(1);
  });

  it("evaluates below-threshold firing", () => {
    const policy = AlertPolicy.createAvailability("avail", "uptime", 99.9, "critical");
    const result = policy.evaluate(99.0);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("firing");
  });

  it("does not fire when disabled", () => {
    const policy = new AlertPolicy({
      name: "disabled-alert", type: "threshold", severity: "low",
      metric: "test", condition: "above", threshold: 50,
      duration: "5m", evaluationIntervalMs: 60_000,
      cooldownMs: 0, enabled: false,
      labels: {}, annotations: {},
    });
    expect(policy.evaluate(100)).toBeNull();
  });

  it("throws on invalid type", () => {
    expect(() =>
      new AlertPolicy({
        name: "bad", type: "invalid" as never, severity: "critical",
        metric: "test", condition: "above", threshold: 10,
        duration: "5m", evaluationIntervalMs: 60_000,
        cooldownMs: 0, enabled: true, labels: {}, annotations: {},
      }),
    ).toThrow(MonitoringValidationError);
  });
});

describe("AlertEngine", () => {
  it("registers and evaluates a policy", () => {
    const engine = new AlertEngine();
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());

    const results = engine.evaluate("cpu_usage", 95);
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("firing");
  });

  it("evaluates multiple metrics", () => {
    const engine = new AlertEngine();
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());
    engine.registerPolicy(AlertPolicy.createLatency("latency", "latency_ms", 500, "critical").toConfig());

    const results = engine.evaluateAll({ cpu_usage: 95, latency_ms: 600 });
    expect(results).toHaveLength(2);
  });

  it("resolves an alert", () => {
    const engine = new AlertEngine();
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());

    const alerts = engine.evaluate("cpu_usage", 95);
    const resolved = engine.resolveAlert(alerts[0]!.id);
    expect(resolved).toBeDefined();
    expect(resolved!.status).toBe("resolved");
    expect(resolved!.resolvedAt).toBeDefined();
  });

  it("acknowledges an alert", () => {
    const engine = new AlertEngine();
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());

    const alerts = engine.evaluate("cpu_usage", 95);
    const acknowledged = engine.acknowledgeAlert(alerts[0]!.id, "engineer@example.com");
    expect(acknowledged).toBeDefined();
    expect(acknowledged!.status).toBe("acknowledged");
    expect(acknowledged!.acknowledgedBy).toBe("engineer@example.com");
  });

  it("returns undefined for unknown alert resolution", () => {
    const engine = new AlertEngine();
    expect(engine.resolveAlert("unknown")).toBeUndefined();
  });

  it("lists active alerts filtered by status", () => {
    const engine = new AlertEngine();
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());

    engine.evaluate("cpu_usage", 95);
    const firing = engine.listActiveAlerts("firing");
    expect(firing).toHaveLength(1);

    const resolved = engine.listActiveAlerts("resolved");
    expect(resolved).toHaveLength(0);
  });

  it("tracks alert history", () => {
    const engine = new AlertEngine();
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());

    engine.evaluate("cpu_usage", 95);
    engine.evaluate("cpu_usage", 50); // below threshold, no alert
    engine.evaluate("cpu_usage", 98);

    expect(engine.getAlertHistory()).toHaveLength(1); // cooldown prevents second
  });

  it("publishes alert events", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) { events.push(event.type); },
      async publishMany() {},
    };

    const engine = new AlertEngine({ eventPublisher: publisher });
    engine.registerPolicy(AlertPolicy.createThreshold("cpu", "cpu_usage", 80, "high").toConfig());

    engine.evaluate("cpu_usage", 95);
    expect(events).toContain("alert.triggered");
  });
});
