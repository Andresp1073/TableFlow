import { describe, it, expect } from "vitest";
import { MetricsEngine, RevenueMetricStrategy, AverageTicketStrategy, OccupancyRateStrategy } from "../domain/services/MetricsEngine.js";
import { BusinessMetric } from "../domain/models/BusinessMetric.js";

describe("MetricsEngine", () => {
  const engine = new MetricsEngine();

  it("registers default strategies", () => {
    const registered = engine.listRegisteredMetrics();
    expect(registered).toContain("revenue");
    expect(registered).toContain("average_ticket");
    expect(registered).toContain("occupancy_rate");
    expect(registered).toContain("reservation_conversion");
    expect(registered).toContain("no_show_rate");
    expect(registered).toContain("customer_retention");
    expect(registered).toContain("inventory_turnover");
    expect(registered).toContain("kitchen_prep_time");
    expect(registered.length).toBe(8);
  });

  it("calculates a single metric", async () => {
    const metric = await engine.calculateMetric({
      restaurantId: "rest-1",
      metricName: "revenue",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-17"),
    });
    expect(metric).toBeInstanceOf(BusinessMetric);
    expect(metric.name).toBe("revenue");
    expect(metric.category).toBe("financial");
    expect(metric.unit).toBe("usd");
    expect(metric.restaurantId).toBe("rest-1");
  });

  it("calculates multiple metrics", async () => {
    const metrics = await engine.calculateMetrics(
      {
        restaurantId: "rest-1",
        periodStart: new Date("2026-07-01"),
        periodEnd: new Date("2026-07-17"),
      },
      ["revenue", "average_ticket"],
    );
    expect(metrics.length).toBe(2);
    expect(metrics[0].name).toBe("revenue");
    expect(metrics[1].name).toBe("average_ticket");
  });

  it("throws for unregistered metric", async () => {
    await expect(
      engine.calculateMetric({
        restaurantId: "rest-1",
        metricName: "nonexistent",
        periodStart: new Date(),
        periodEnd: new Date(),
      }),
    ).rejects.toThrow("No strategy or provider registered for metric: nonexistent");
  });

  it("hasStrategy returns correct status", () => {
    expect(engine.hasStrategy("revenue")).toBe(true);
    expect(engine.hasStrategy("nonexistent")).toBe(false);
  });

  it("allows registering custom strategies", () => {
    const customStrategy = new (class implements import("../domain/services/MetricsEngine.js").MetricStrategy {
      readonly metricName = "custom_metric";
      readonly category: import("../domain/models/BusinessMetric.js").MetricCategory = "operational";
      readonly unit: import("../domain/models/BusinessMetric.js").MetricUnit = "count";
      async calculate() {
        return { name: "custom_metric", category: "operational" as const, value: 42, unit: "count" as const, period: "daily" as const };
      }
    })();
    engine.registerStrategy(customStrategy);
    expect(engine.hasStrategy("custom_metric")).toBe(true);
    engine.unregisterStrategy("custom_metric");
    expect(engine.hasStrategy("custom_metric")).toBe(false);
  });

  it("allows registering custom providers", async () => {
    engine.registerProvider("dynamic_metric", async () => ({
      name: "dynamic_metric",
      category: "financial" as const,
      value: 99.99,
      unit: "usd" as const,
      period: "weekly" as const,
    }));
    const metric = await engine.calculateMetric({
      restaurantId: "rest-1",
      metricName: "dynamic_metric",
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    expect(metric.value).toBe(99.99);
    engine.unregisterStrategy("dynamic_metric");
  });

  it("creates metric records from metrics", () => {
    const metric = BusinessMetric.create({
      id: "m-1", restaurantId: "rest-1", name: "revenue",
      category: "financial", value: 1000, unit: "usd",
      period: "daily", dimensions: {},
    });
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-01");
    const record = engine.createRecord(metric, start, end);
    expect(record.metricName).toBe("revenue");
    expect(record.value).toBe(1000);
    expect(record.periodStart).toEqual(start);
    expect(record.periodEnd).toEqual(end);
  });

  it("individual strategies return correct metadata", () => {
    const revenue = new RevenueMetricStrategy();
    expect(revenue.metricName).toBe("revenue");
    expect(revenue.category).toBe("financial");
    expect(revenue.unit).toBe("usd");

    const avgTicket = new AverageTicketStrategy();
    expect(avgTicket.metricName).toBe("average_ticket");
    expect(avgTicket.unit).toBe("usd");

    const occupancy = new OccupancyRateStrategy();
    expect(occupancy.metricName).toBe("occupancy_rate");
    expect(occupancy.unit).toBe("percentage");
  });
});
