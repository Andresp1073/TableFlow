import { describe, it, expect } from "vitest";
import { ReportGenerator } from "../domain/services/ReportGenerator.js";
import { AnalyticsDataset } from "../domain/models/AnalyticsDataset.js";
import { MetricRecord } from "../domain/models/MetricRecord.js";
import type { TrendAnalysis } from "../domain/services/TrendAnalyzer.js";

describe("ReportGenerator", () => {
  const generator = new ReportGenerator();
  const baseParams = {
    restaurantId: "rest-1",
    name: "Test Report",
    format: "json" as const,
    parameters: { period: "daily" },
  };

  function makeRecord(value: number, metricName: string): MetricRecord {
    return MetricRecord.reconstitute({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      metricName,
      category: "financial",
      value,
      unit: "usd",
      period: "daily",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-01"),
      dimensions: {},
      recordedAt: new Date("2026-07-01"),
    });
  }

  function makeDataset(): AnalyticsDataset {
    return AnalyticsDataset.reconstitute({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      name: "Source Dataset",
      type: "aggregated",
      dimensions: ["restaurant"],
      metrics: ["revenue", "occupancy_rate"],
      records: [
        { restaurant: "rest-1", revenue: 1000, occupancy_rate: 0.8 },
        { restaurant: "rest-1", revenue: 2000, occupancy_rate: 0.9 },
      ],
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-17"),
      builtAt: new Date(),
    });
  }

  it("generates report from raw data", () => {
    const data = [{ metric: "revenue", value: 1000 }];
    const report = generator.generateFromData(baseParams, data);
    expect(report.name).toBe("Test Report");
    expect(report.recordCount()).toBe(1);
    expect(report.data[0].value).toBe(1000);
  });

  it("generates report from dataset with summary", () => {
    const dataset = makeDataset();
    const report = generator.generateFromDataset(baseParams, dataset);
    expect(report.recordCount()).toBe(2);
    expect(report.summary).toBeDefined();
    expect(report.summary!.revenue).toBeDefined();
  });

  it("generates trend report", () => {
    const trends: TrendAnalysis[] = [{
      metricName: "revenue",
      direction: "increasing",
      currentValue: 2000,
      previousValue: 1000,
      changePercent: 100,
      values: [500, 1000, 2000],
      periodCount: 3,
    }];
    const report = generator.generateTrendReport(baseParams, trends);
    expect(report.recordCount()).toBe(1);
    expect(report.data[0].direction).toBe("increasing");
  });

  it("generates comparison report", () => {
    const comparisons = [{
      metricName: "revenue",
      currentValue: 2000,
      previousValue: 1000,
      absoluteChange: 1000,
      percentChange: 100,
    }];
    const report = generator.generateComparisonReport(baseParams, comparisons);
    expect(report.recordCount()).toBe(1);
    expect(report.data[0].percentChange).toBe(100);
  });

  it("generates growth report", () => {
    const records = [
      makeRecord(1000, "revenue"),
      makeRecord(2000, "revenue"),
      makeRecord(3000, "revenue"),
    ];
    const report = generator.generateGrowthReport(baseParams, records);
    expect(report.recordCount()).toBe(1);
    expect(report.data[0].totalGrowth).toBeGreaterThan(0);
  });

  it("generates performance report from multiple datasets", () => {
    const datasets = [makeDataset(), makeDataset()];
    const report = generator.generatePerformanceReport(baseParams, datasets);
    expect(report.recordCount()).toBe(4);
    expect(report.summary!.datasetsUsed).toBe(2);
  });

  it("generates efficiency report", () => {
    const records = [
      makeRecord(30, "kitchen_prep_time"),
      makeRecord(1000, "revenue"),
    ];
    const report = generator.generateEfficiencyReport(baseParams, records);
    expect(report.recordCount()).toBe(3);
  });

  it("generates scheduled report", () => {
    const records = [
      makeRecord(1000, "revenue"),
      makeRecord(2000, "revenue"),
      makeRecord(3000, "revenue"),
    ];
    const report = generator.generateScheduledReport(baseParams, records);
    expect(report.type).toBe("scheduled");
    expect(report.data[0]).toHaveProperty("current");
    expect(report.data[0]).toHaveProperty("average");
    expect(report.data[0]).toHaveProperty("trend");
  });

  it("converts report to CSV", () => {
    const data = [
      { metric: "revenue", value: 1000 },
      { metric: "occupancy", value: 0.8 },
    ];
    const report = generator.generateFromData(baseParams, data);
    const csv = report.toCSV();
    expect(csv).toContain("metric");
    expect(csv).toContain("revenue");
    expect(csv).toContain("1000");
  });

  it("converts report to JSON", () => {
    const data = [{ metric: "revenue", value: 1000 }];
    const report = generator.generateFromData(baseParams, data);
    const json = report.toJSON();
    expect(json.name).toBe("Test Report");
    expect(json.data).toEqual(data);
  });
});
