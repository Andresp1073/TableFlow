import { describe, it, expect } from "vitest";
import { TrendAnalyzer } from "../domain/services/TrendAnalyzer.js";
import { MetricRecord } from "../domain/models/MetricRecord.js";

describe("TrendAnalyzer", () => {
  const analyzer = new TrendAnalyzer();

  function makeRecord(value: number, date: Date, metricName = "revenue"): MetricRecord {
    return MetricRecord.reconstitute({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      metricName,
      category: "financial",
      value,
      unit: "usd",
      period: "daily",
      periodStart: date,
      periodEnd: date,
      dimensions: {},
      recordedAt: date,
    });
  }

  it("detects increasing trend", () => {
    const records = [100, 200, 300, 400, 500].map((v, i) =>
      makeRecord(v, new Date(2026, 6, i + 1)),
    );
    const trends = analyzer.analyze(records);
    expect(trends[0].direction).toBe("increasing");
  });

  it("detects decreasing trend", () => {
    const records = [500, 400, 300, 200, 100].map((v, i) =>
      makeRecord(v, new Date(2026, 6, i + 1)),
    );
    const trends = analyzer.analyze(records);
    expect(trends[0].direction).toBe("decreasing");
  });

  it("detects stable trend", () => {
    const records = [100, 101, 99, 100, 102].map((v, i) =>
      makeRecord(v, new Date(2026, 6, i + 1)),
    );
    const trends = analyzer.analyze(records);
    expect(trends[0].direction).toBe("stable");
  });

  it("detects volatile trend", () => {
    const records = [100, 500, 50, 600, 30].map((v, i) =>
      makeRecord(v, new Date(2026, 6, i + 1)),
    );
    const trends = analyzer.analyze(records);
    expect(trends[0].direction).toBe("volatile");
  });

  it("returns stable for fewer than 3 records", () => {
    const records = [100, 200].map((v, i) =>
      makeRecord(v, new Date(2026, 6, i + 1)),
    );
    const trends = analyzer.analyze(records);
    expect(trends[0].direction).toBe("stable");
  });

  it("groups metrics by name", () => {
    const records = [
      makeRecord(100, new Date(), "revenue"),
      makeRecord(200, new Date(), "revenue"),
      makeRecord(0.8, new Date(), "occupancy"),
    ];
    const trends = analyzer.analyze(records);
    expect(trends.length).toBe(2);
    expect(trends.find((t) => t.metricName === "revenue")).toBeDefined();
    expect(trends.find((t) => t.metricName === "occupancy")).toBeDefined();
  });

  it("compares two periods", () => {
    const current = [
      makeRecord(2000, new Date("2026-07-17")),
      makeRecord(0.9, new Date("2026-07-17"), "occupancy"),
    ];
    const previous = [
      makeRecord(1000, new Date("2026-07-10")),
      makeRecord(0.8, new Date("2026-07-10"), "occupancy"),
    ];
    const results = analyzer.comparePeriods(current, previous);
    expect(results.length).toBe(2);
    const revenueResult = results.find((r) => r.metricName === "revenue");
    expect(revenueResult?.percentChange).toBe(100);
  });

  it("handles empty record sets", () => {
    const trends = analyzer.analyze([]);
    expect(trends.length).toBe(0);
  });

  it("calculates correct change percent", () => {
    const records = [100, 200].map((v, i) =>
      makeRecord(v, new Date(2026, 6, i + 1)),
    );
    const trends = analyzer.analyze(records);
    expect(trends[0].changePercent).toBe(100);
    expect(trends[0].currentValue).toBe(200);
    expect(trends[0].previousValue).toBe(100);
  });
});
