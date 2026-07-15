import { describe, it, expect } from "vitest";
import { ServiceLevelIndicator } from "../ServiceLevelIndicator.js";
import { ServiceLevelObjective } from "../ServiceLevelObjective.js";
import { ErrorBudget } from "../ErrorBudget.js";
import { MonitoringValidationError } from "../errors.js";

describe("ServiceLevelIndicator", () => {
  it("creates an availability SLI", () => {
    const sli = ServiceLevelIndicator.createAvailability(
      "api-availability", "sum(up{job='api'})", "count(up{job='api'})", 99.9,
    );
    expect(sli.name).toBe("api-availability");
    expect(sli.type).toBe("availability");
    expect(sli.targetValue).toBe(99.9);
  });

  it("creates a latency SLI", () => {
    const sli = ServiceLevelIndicator.createLatency("api-latency", "histogram_quantile(0.99, ...)", 200);
    expect(sli.type).toBe("latency");
    expect(sli.targetValue).toBe(200);
  });

  it("creates an error rate SLI", () => {
    const sli = ServiceLevelIndicator.createErrorRate("api-errors", "sum(errors)", "sum(requests)", 1);
    expect(sli.type).toBe("error_rate");
    expect(sli.targetValue).toBe(1);
  });

  it("records a value and returns result", () => {
    const sli = ServiceLevelIndicator.createAvailability("test", "num", "den", 99.9);
    const result = sli.record(99.95);
    expect(result.currentValue).toBe(99.95);
    expect(result.targetValue).toBe(99.9);
  });

  it("checks if target is met for availability", () => {
    const sli = ServiceLevelIndicator.createAvailability("test", "num", "den", 99.9);
    sli.record(99.95);
    expect(sli.meetsTarget()).toBe(true);
    sli.record(99.0);
    expect(sli.meetsTarget()).toBe(false);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new ServiceLevelIndicator({
        name: "test", type: "invalid" as never, metric: "test",
        numeratorQuery: "a", denominatorQuery: "b",
        evaluationWindowMs: 300_000, targetValue: 99,
      }),
    ).toThrow(MonitoringValidationError);
  });
});

describe("ServiceLevelObjective", () => {
  it("creates an availability SLO", () => {
    const slo = ServiceLevelObjective.createAvailability("api-slo", "sum(up)", "count(up)", 99.9);
    expect(slo.name).toBe("api-slo");
    expect(slo.target).toBe(99.9);
    expect(slo.warningThreshold).toBe(99.5);
  });

  it("creates a latency SLO", () => {
    const slo = ServiceLevelObjective.createLatency("api-latency-slo", "p99_query", 200, 95, 90);
    expect(slo.name).toBe("api-latency-slo");
    expect(slo.target).toBe(95);
    expect(slo.warningThreshold).toBe(90);
  });

  it("evaluates compliance as achieved", () => {
    const slo = ServiceLevelObjective.createAvailability("slo", "num", "den", 99.9);
    const result = slo.evaluate(99.95);
    expect(result.compliance).toBe("achieved");
    expect(result.errorBudget.status).toBe("healthy");
  });

  it("evaluates compliance as warning", () => {
    const slo = ServiceLevelObjective.createAvailability("slo", "num", "den", 99.9, 99.0);
    const result = slo.evaluate(99.5);
    expect(result.compliance).toBe("warning");
  });

  it("evaluates compliance as breached", () => {
    const slo = ServiceLevelObjective.createAvailability("slo", "num", "den", 99.9);
    const result = slo.evaluate(95.0);
    expect(result.compliance).toBe("breached");
  });

  it("throws on invalid target", () => {
    expect(() =>
      ServiceLevelObjective.createAvailability("bad", "num", "den", 0),
    ).toThrow(MonitoringValidationError);
  });

  it("throws on warning >= target", () => {
    expect(() =>
      ServiceLevelObjective.createAvailability("bad", "num", "den", 99.9, 99.9),
    ).toThrow(MonitoringValidationError);
  });
});

describe("ErrorBudget", () => {
  it("creates an error budget with target", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    expect(budget.totalBudget).toBeCloseTo(0.1);
    expect(budget.getRemaining()).toBeCloseTo(0.1);
    expect(budget.getStatus()).toBe("healthy");
  });

  it("consumes budget and tracks remaining", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    const result = budget.consume(0.05);
    expect(result.consumed).toBeCloseTo(0.05);
    expect(result.remaining).toBeCloseTo(0.05);
  });

  it("detects exhausted budget", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    budget.consume(0.1);
    expect(budget.isExhausted()).toBe(true);
    expect(budget.getStatus()).toBe("exhausted");
  });

  it("detects warning budget", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    budget.consume(0.06);
    expect(budget.isWarning()).toBe(true);
    expect(budget.isExhausted()).toBe(false);
    expect(budget.getStatus()).toBe("warning");
  });

  it("resets budget", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    budget.consume(0.05);
    budget.reset();
    expect(budget.getConsumed()).toBe(0);
    expect(budget.getRemaining()).toBeCloseTo(0.1);
    expect(budget.getStatus()).toBe("healthy");
  });

  it("calculates consumption rate", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    budget.consume(0.02);
    budget.consume(0.03);
    expect(budget.getConsumptionRate()).toBeCloseTo(0.025);
  });

  it("converts to result", () => {
    const budget = new ErrorBudget("api-slo", 99.9);
    const result = budget.toResult();
    expect(result.sloName).toBe("api-slo");
    expect(result.status).toBe("healthy");
    expect(result.lastUpdated).toBeDefined();
  });
});
