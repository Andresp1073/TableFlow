import { describe, it, expect } from "vitest";
import { KpiEngine } from "../domain/services/KpiEngine.js";
import { KpiDefinition, type KpiStatus } from "../domain/models/KpiDefinition.js";
import { MetricRecord } from "../domain/models/MetricRecord.js";

describe("KpiEngine", () => {
  const engine = new KpiEngine();

  function makeMetricRecord(value: number, metricName = "revenue"): MetricRecord {
    return MetricRecord.reconstitute({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      metricName,
      category: "financial",
      value,
      unit: "usd",
      period: "daily",
      periodStart: new Date(),
      periodEnd: new Date(),
      dimensions: {},
      recordedAt: new Date(),
    });
  }

  function makeKpi(defOverrides?: Partial<KpiDefinition["data"]>): KpiDefinition {
    return KpiDefinition.reconstitute({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      name: "Daily Revenue",
      metricName: "revenue",
      formula: "direct",
      target: 5000,
      warningThreshold: 0.1,
      criticalThreshold: 0.2,
      unit: "usd",
      period: "daily",
      direction: "higher_is_better",
      isActive: true,
      ...defOverrides,
    });
  }

  it("calculates direct formula", () => {
    const def = makeKpi();
    const records = [makeMetricRecord(4500)];
    const value = engine.calculateValue(def, records);
    expect(value).toBe(4500);
  });

  it("calculates average formula", () => {
    const def = makeKpi({ formula: "average" });
    const records = [makeMetricRecord(1000), makeMetricRecord(2000), makeMetricRecord(3000)];
    const value = engine.calculateValue(def, records);
    expect(value).toBe(2000);
  });

  it("calculates sum formula", () => {
    const def = makeKpi({ formula: "sum" });
    const records = [makeMetricRecord(100), makeMetricRecord(200), makeMetricRecord(300)];
    const value = engine.calculateValue(def, records);
    expect(value).toBe(600);
  });

  it("calculates ratio formula", () => {
    const def = makeKpi({ formula: "ratio" });
    const records = [makeMetricRecord(100), makeMetricRecord(50)];
    const value = engine.calculateValue(def, records);
    expect(value).toBe(0.5);
  });

  it("returns 0 for ratio with single record", () => {
    const def = makeKpi({ formula: "ratio" });
    const records = [makeMetricRecord(100)];
    const value = engine.calculateValue(def, records);
    expect(value).toBe(0);
  });

  it("returns 0 for empty records", () => {
    const def = makeKpi();
    const value = engine.calculateValue(def, []);
    expect(value).toBe(0);
  });

  it("evaluates on_track status", () => {
    const def = makeKpi();
    const status = def.evaluateStatus(5000);
    expect(status).toBe("exceeded");
  });

  it("evaluates warning status", () => {
    const def = makeKpi({ warningThreshold: 0.1, criticalThreshold: 0.3 });
    const status = def.evaluateStatus(4500);
    expect(status).toBe("warning");
  });

  it("evaluates critical status", () => {
    const def = makeKpi({ warningThreshold: 0.1, criticalThreshold: 0.2 });
    const status = def.evaluateStatus(3500);
    expect(status).toBe("critical");
  });

  it("evaluates exceeded for higher_is_better", () => {
    const def = makeKpi({ direction: "higher_is_better" });
    const status = def.evaluateStatus(6000);
    expect(status).toBe("exceeded");
  });

  it("evaluates exceeded for lower_is_better", () => {
    const def = makeKpi({ direction: "lower_is_better" });
    const status = def.evaluateStatus(3000);
    expect(status).toBe("exceeded");
  });

  it("calculates variance correctly", () => {
    const def = makeKpi({ target: 5000 });
    expect(def.calculateVariance(5500)).toBeCloseTo(0.1);
    expect(def.calculateVariance(4500)).toBeCloseTo(-0.1);
    expect(def.calculateVariance(5000)).toBeCloseTo(0);
  });

  it("creates KPI records with correct status", () => {
    const def = makeKpi();
    const record = engine.createRecord(def, 4500, "daily", new Date("2026-07-17"), new Date("2026-07-17"));
    expect(record.value).toBe(4500);
    expect(record.target).toBe(5000);
    expect(record.variance).toBeCloseTo(-0.1);
    expect(record.status).toBe("warning");
    expect(record.period).toBe("daily");
  });

  it("calculates multiple KPIs", () => {
    const defs = [
      makeKpi({ id: "kpi-1", name: "Revenue", metricName: "revenue", formula: "direct" }),
      makeKpi({ id: "kpi-2", name: "Avg Revenue", metricName: "revenue", formula: "average" }),
    ];
    const records = [makeMetricRecord(1000), makeMetricRecord(2000), makeMetricRecord(3000)];
    const results = engine.calculateMultiple(defs, records, {
      restaurantId: "rest-1",
      period: "daily",
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    expect(results.length).toBe(2);
    expect(results[0].value).toBe(3000);
    expect(results[1].value).toBe(2000);
  });

  it("filters records by metric name", () => {
    const records = [
      makeMetricRecord(100, "revenue"),
      makeMetricRecord(200, "revenue"),
      makeMetricRecord(50, "occupancy"),
    ];
    const filtered = engine.filterRecordsByMetricName(records, "revenue");
    expect(filtered.length).toBe(2);
    expect(filtered[0].value).toBe(100);
    expect(filtered[1].value).toBe(200);
  });

  it("KpiDefinition handles activate/deactivate", () => {
    const def = makeKpi({ isActive: true });
    expect(def.isActive).toBe(true);
    const deactivated = def.deactivate();
    expect(deactivated.isActive).toBe(false);
    const reactivated = deactivated.activate();
    expect(reactivated.isActive).toBe(true);
  });
});
