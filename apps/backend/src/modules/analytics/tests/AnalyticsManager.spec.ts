import { describe, it, expect } from "vitest";
import { AnalyticsManager } from "../domain/services/AnalyticsManager.js";
import {
  InMemoryMetricRepository,
  InMemoryKpiRepository,
  InMemoryDatasetRepository,
  InMemoryReportRepository,
  InMemoryAnalyticsQueryRepository,
} from "../infrastructure/repositories/InMemoryAnalyticsRepositories.js";
import { KpiDefinition } from "../domain/models/KpiDefinition.js";
import { ReportDefinition } from "../domain/models/ReportDefinition.js";
import { AnalyticsQuery } from "../domain/models/AnalyticsQuery.js";
import { MetricCalculated } from "../domain/events/MetricCalculated.js";
import { AnalyticsDatasetBuilt } from "../domain/events/AnalyticsDatasetBuilt.js";
import { ReportGenerated } from "../domain/events/ReportGenerated.js";

describe("AnalyticsManager", () => {
  function createManager(): AnalyticsManager {
    const metricRepo = new InMemoryMetricRepository();
    const kpiRepo = new InMemoryKpiRepository();
    const datasetRepo = new InMemoryDatasetRepository();
    const reportRepo = new InMemoryReportRepository();
    const queryRepo = new InMemoryAnalyticsQueryRepository();
    return new AnalyticsManager(metricRepo, kpiRepo, datasetRepo, reportRepo, queryRepo);
  }

  it("calculates and saves a metric", async () => {
    const manager = createManager();
    const metric = await manager.calculateMetric({
      restaurantId: "rest-1",
      metricName: "revenue",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-17"),
    });
    expect(metric.id).toBeDefined();
    expect(metric.name).toBe("revenue");
    expect(manager.events.length).toBe(1);
    expect(manager.events[0]).toBeInstanceOf(MetricCalculated);

    const saved = await manager.metricRepo.findByRestaurant("rest-1");
    expect(saved.length).toBe(1);
  });

  it("calculates and saves multiple metrics", async () => {
    const manager = createManager();
    const metrics = await manager.calculateMetrics(
      { restaurantId: "rest-1", periodStart: new Date(), periodEnd: new Date() },
      ["revenue", "average_ticket"],
    );
    expect(metrics.length).toBe(2);
    expect(manager.events.length).toBe(2);
  });

  it("updates KPIs from metric records", async () => {
    const manager = createManager();
    const def = KpiDefinition.create({
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
    });
    await manager.createKpiDefinition(def);

    await manager.calculateMetric({
      restaurantId: "rest-1",
      metricName: "revenue",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-17"),
    });

    await manager.updateKpis("rest-1", "daily", new Date("2026-07-17"), new Date("2026-07-17"));
    const kpiDefs = await manager.kpiRepo.findDefinitionsByRestaurant("rest-1");
    expect(kpiDefs.length).toBe(1);
  });

  it("builds datasets of different types", async () => {
    const manager = createManager();
    const dataset = await manager.buildDataset({
      restaurantId: "rest-1",
      name: "Revenue Dataset",
      type: "aggregated",
      dimensions: [],
      metrics: ["revenue"],
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-17"),
    });
    expect(dataset.type).toBe("aggregated");
    expect(manager.events.some((e) => e instanceof AnalyticsDatasetBuilt)).toBe(true);
  });

  it("generates reports", async () => {
    const manager = createManager();
    const report = await manager.generateReport({
      restaurantId: "rest-1",
      name: "Test Report",
      format: "json",
      parameters: {},
    }, [{ metric: "revenue", value: 1000 }]);
    expect(report.name).toBe("Test Report");
    expect(manager.events.some((e) => e instanceof ReportGenerated)).toBe(true);
  });

  it("creates report definitions", async () => {
    const manager = createManager();
    const def = ReportDefinition.create({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      name: "Daily Revenue Report",
      metrics: ["revenue"],
      dimensions: ["restaurant"],
      filters: [],
      format: "json",
      type: "scheduled",
      schedule: {
        cron: "0 6 * * *",
        timezone: "America/New_York",
        period: "daily",
      },
    });
    await manager.createReportDefinition(def);
    const defs = await manager.reportRepo.findDefinitionsByRestaurant("rest-1");
    expect(defs.length).toBe(1);
    expect(defs[0].isScheduled()).toBe(true);
  });

  it("saves analytics queries", async () => {
    const manager = createManager();
    const query = AnalyticsQuery.create({
      id: crypto.randomUUID(),
      restaurantId: "rest-1",
      name: "Revenue Query",
      metrics: ["revenue"],
      dimensions: ["time"],
      filters: [],
      period: "daily",
    });
    await manager.saveQuery(query);
    const queries = await manager.queryRepo.findByRestaurant("rest-1");
    expect(queries.length).toBe(1);
  });

  it("retrieves metrics, kpis, datasets, and reports", async () => {
    const manager = createManager();
    await manager.calculateMetric({
      restaurantId: "rest-1",
      metricName: "revenue",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-17"),
    });
    await manager.buildDataset({
      restaurantId: "rest-1",
      name: "DS",
      type: "aggregated",
      dimensions: [],
      metrics: ["revenue"],
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    await manager.generateReport({
      restaurantId: "rest-1",
      name: "RPT",
      format: "json",
      parameters: {},
    }, [{ v: 1 }]);

    const metrics = await manager.getMetrics("rest-1");
    expect(metrics.length).toBe(1);

    const datasets = await manager.getDatasets("rest-1");
    expect(datasets.length).toBe(1);

    const reports = await manager.getReports("rest-1");
    expect(reports.length).toBe(1);
  });
});
