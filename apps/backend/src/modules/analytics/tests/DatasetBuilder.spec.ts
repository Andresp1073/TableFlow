import { describe, it, expect } from "vitest";
import { DatasetBuilder } from "../domain/services/DatasetBuilder.js";
import { MetricRecord } from "../domain/models/MetricRecord.js";

describe("DatasetBuilder", () => {
  const builder = new DatasetBuilder();
  const baseParams = {
    restaurantId: "rest-1",
    name: "Test Dataset",
    dimensions: ["restaurant", "dining_area"],
    metrics: ["revenue", "occupancy_rate"],
    periodStart: new Date("2026-07-01"),
    periodEnd: new Date("2026-07-17"),
  };

  function makeRecord(value: number, metricName: string, dims?: Record<string, string>): MetricRecord {
    return MetricRecord.reconstitute({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      metricName,
      category: metricName === "revenue" ? "financial" : "operational",
      value,
      unit: metricName === "revenue" ? "usd" : "percentage",
      period: "daily",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-01"),
      dimensions: { restaurant: "rest-1", dining_area: "main", ...dims },
      recordedAt: new Date("2026-07-01"),
    });
  }

  it("builds aggregated dataset", () => {
    const records = [
      makeRecord(1000, "revenue", { dining_area: "main" }),
      makeRecord(2000, "revenue", { dining_area: "patio" }),
      makeRecord(0.8, "occupancy_rate", { dining_area: "main" }),
    ];
    const dataset = builder.buildAggregated(baseParams, records);
    expect(dataset.type).toBe("aggregated");
    expect(dataset.recordCount()).toBe(2);
    expect(dataset.metrics).toContain("revenue");
    expect(dataset.metrics).toContain("occupancy_rate");
  });

  it("builds historical dataset", () => {
    const records = [
      makeRecord(1000, "revenue"),
      makeRecord(2000, "revenue"),
    ];
    const dataset = builder.buildHistorical(baseParams, records);
    expect(dataset.type).toBe("historical");
    expect(dataset.recordCount()).toBe(2);
    expect(dataset.data[0]).toHaveProperty("metricName");
    expect(dataset.data[0]).toHaveProperty("value");
    expect(dataset.data[0]).toHaveProperty("recordedAt");
  });

  it("builds operational dataset with latest records", () => {
    const records = [
      makeRecord(1000, "revenue"),
      MetricRecord.reconstitute({
        id: crypto.randomUUID(),
        restaurantId: "rest-1",
        metricName: "revenue",
        category: "financial",
        value: 2000,
        unit: "usd",
        period: "daily",
        periodStart: new Date("2026-07-02"),
        periodEnd: new Date("2026-07-02"),
        dimensions: { restaurant: "rest-1", dining_area: "main" },
        recordedAt: new Date("2026-07-02"),
      }),
    ];
    const dataset = builder.buildOperational(baseParams, records);
    expect(dataset.type).toBe("operational");
    expect(dataset.data[0].value).toBe(2000);
  });

  it("builds analytical dataset (pivot)", () => {
    const records = [
      makeRecord(1000, "revenue"),
      makeRecord(0.8, "occupancy_rate"),
    ];
    const dataset = builder.buildAnalytical(baseParams, records);
    expect(dataset.type).toBe("analytical");
    expect(dataset.data[0]).toHaveProperty("revenue");
    expect(dataset.data[0]).toHaveProperty("occupancy_rate");
  });

  it("handles empty records", () => {
    const dataset = builder.buildAggregated(baseParams, []);
    expect(dataset.recordCount()).toBe(0);
    expect(dataset.isEmpty()).toBe(true);
  });

  it("creates dataset with correct metadata", () => {
    const dataset = builder.buildAggregated(baseParams, []);
    expect(dataset.name).toBe("Test Dataset");
    expect(dataset.restaurantId).toBe("rest-1");
    expect(dataset.dimensions).toEqual(["restaurant", "dining_area"]);
    expect(dataset.periodStart).toEqual(baseParams.periodStart);
    expect(dataset.periodEnd).toEqual(baseParams.periodEnd);
  });
});
