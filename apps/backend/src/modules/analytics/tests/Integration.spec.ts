import { describe, it, expect } from "vitest";
import { BusinessIntelligenceService } from "../application/services/BusinessIntelligenceService.js";
import {
  InMemoryMetricRepository,
  InMemoryKpiRepository,
  InMemoryDatasetRepository,
  InMemoryReportRepository,
  InMemoryAnalyticsQueryRepository,
} from "../infrastructure/repositories/InMemoryAnalyticsRepositories.js";

describe("Analytics Integration", () => {
  function createService(): BusinessIntelligenceService {
    const metricRepo = new InMemoryMetricRepository();
    const kpiRepo = new InMemoryKpiRepository();
    const datasetRepo = new InMemoryDatasetRepository();
    const reportRepo = new InMemoryReportRepository();
    const queryRepo = new InMemoryAnalyticsQueryRepository();
    return new BusinessIntelligenceService(metricRepo, kpiRepo, datasetRepo, reportRepo, queryRepo);
  }

  it("full metric calculation lifecycle", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    const metrics = await service.calculateMetrics("rest-1", start, end, ["revenue", "average_ticket", "occupancy_rate"]);
    expect(metrics.length).toBe(3);

    const saved = await service.getMetrics("rest-1");
    expect(saved.length).toBe(3);
    expect(saved[0].restaurantId).toBe("rest-1");
  });

  it("KPI definition and update lifecycle", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    await service.calculateMetrics("rest-1", start, end, ["revenue"]);

    const dto = await service.createKpiDefinition(
      "rest-1", "Daily Revenue Target", "revenue", "direct",
      5000, 0.1, 0.2, "usd", "daily", "higher_is_better",
    );
    expect(dto.name).toBe("Daily Revenue Target");
    expect(dto.target).toBe(5000);

    const defs = await service.getKpiDefinitions("rest-1");
    expect(defs.length).toBe(1);
  });

  it("dataset building lifecycle", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    await service.calculateMetrics("rest-1", start, end, ["revenue", "occupancy_rate"]);

    const dataset = await service.buildDataset(
      "rest-1", "Aggregated View", "aggregated", ["restaurant"], ["revenue", "occupancy_rate"], start, end,
    );
    expect(dataset.type).toBe("aggregated");

    const datasets = await service.getDatasets("rest-1");
    expect(datasets.length).toBe(1);
  });

  it("report generation lifecycle", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    const report = await service.generateReport(
      "rest-1", "Revenue Report", "json", { period: "daily" },
      [{ metric: "revenue", value: 5000 }], start, end,
    );
    expect(report.name).toBe("Revenue Report");
    expect(report.recordCount).toBe(1);

    const reports = await service.getReports("rest-1");
    expect(reports.length).toBe(1);
  });

  it("report definition creation", async () => {
    const service = createService();
    await service.createReportDefinition(
      "rest-1", "Daily Summary", ["revenue", "occupancy"], ["restaurant", "dining_area"],
      "json", "scheduled",
      [{ dimension: "restaurant", operator: "eq", value: "rest-1" }],
      { cron: "0 6 * * *", timezone: "UTC", period: "daily" },
    );
    const manager = service.getAnalyticsManager();
    const defs = await manager.reportRepo.findDefinitionsByRestaurant("rest-1");
    expect(defs.length).toBe(1);
    expect(defs[0].isScheduled()).toBe(true);
  });

  it("analytics query creation", async () => {
    const service = createService();
    const query = await service.createQuery("rest-1", {
      name: "Revenue Analysis",
      metrics: ["revenue"],
      dimensions: ["time"],
      filters: [],
      period: "daily",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-17",
      limit: 100,
    });
    expect(query.name).toBe("Revenue Analysis");
    expect(query.hasComparison).toBe(false);
  });

  it("trend analysis execution", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    await service.calculateMetrics("rest-1", start, end, ["revenue"]);
    const manager = service.getAnalyticsManager();
    await manager.analyzeTrends("rest-1", start, end);

    expect(manager.events.length).toBeGreaterThanOrEqual(1);
  });

  it("full pipeline: metrics -> KPI -> dataset -> report", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    await service.calculateMetrics("rest-1", start, end, ["revenue", "average_ticket", "occupancy_rate"]);

    await service.createKpiDefinition(
      "rest-1", "Revenue Target", "revenue", "direct", 5000, 0.1, 0.2, "usd", "daily", "higher_is_better",
    );
    await service.updateKpis("rest-1", "daily", start, end);

    const dataset = await service.buildDataset(
      "rest-1", "Full Analysis", "analytical", ["restaurant"], ["revenue", "average_ticket", "occupancy_rate"], start, end,
    );
    expect(dataset.recordCount).toBeGreaterThanOrEqual(0);

    const report = await service.generateReport(
      "rest-1", "Full Pipeline Report", "json", { type: "full_pipeline" },
      dataset.data, start, end,
    );
    expect(report.name).toBe("Full Pipeline Report");

    const metrics = await service.getMetrics("rest-1");
    expect(metrics.length).toBeGreaterThan(0);
    const defs = await service.getKpiDefinitions("rest-1");
    expect(defs.length).toBeGreaterThan(0);
    const datasets = await service.getDatasets("rest-1");
    expect(datasets.length).toBeGreaterThan(0);
    const reports = await service.getReports("rest-1");
    expect(reports.length).toBeGreaterThan(0);
  });

  it("handles multiple restaurants independently", async () => {
    const service = createService();
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-17");

    await service.calculateMetrics("rest-1", start, end, ["revenue"]);
    await service.calculateMetrics("rest-2", start, end, ["revenue"]);

    const rest1Metrics = await service.getMetrics("rest-1");
    const rest2Metrics = await service.getMetrics("rest-2");
    expect(rest1Metrics.length).toBe(1);
    expect(rest2Metrics.length).toBe(1);
  });
});
