import type { MetricRepository } from "../repositories/MetricRepository.js";
import type { KpiRepository } from "../repositories/KpiRepository.js";
import type { DatasetRepository } from "../repositories/DatasetRepository.js";
import type { ReportRepository } from "../repositories/ReportRepository.js";
import type { AnalyticsQueryRepository } from "../repositories/AnalyticsQueryRepository.js";
import { MetricsEngine, type MetricCalculationParams } from "./MetricsEngine.js";
import { KpiEngine, type KpiCalculationParams } from "./KpiEngine.js";
import { TrendAnalyzer } from "./TrendAnalyzer.js";
import { DatasetBuilder, type DatasetBuildParams } from "./DatasetBuilder.js";
import { ReportGenerator, type ReportGenerationParams } from "./ReportGenerator.js";
import type { BusinessMetric } from "../models/BusinessMetric.js";
import type { KpiDefinition, KpiPeriod } from "../models/KpiDefinition.js";
import type { AnalyticsDataset, DatasetType } from "../models/AnalyticsDataset.js";
import type { AnalyticsReport, AnalyticsReportConfig } from "../models/AnalyticsReport.js";
import type { AnalyticsQuery } from "../models/AnalyticsQuery.js";
import { MetricCalculated } from "../events/MetricCalculated.js";
import { KpiUpdated } from "../events/KpiUpdated.js";
import { AnalyticsDatasetBuilt } from "../events/AnalyticsDatasetBuilt.js";
import { ReportGenerated } from "../events/ReportGenerated.js";
import { TrendDetected } from "../events/TrendDetected.js";

export class AnalyticsManager {
  readonly metricsEngine: MetricsEngine;
  readonly kpiEngine: KpiEngine;
  readonly trendAnalyzer: TrendAnalyzer;
  readonly datasetBuilder: DatasetBuilder;
  readonly reportGenerator: ReportGenerator;
  readonly events: unknown[] = [];

  constructor(
    private readonly metricRepo: MetricRepository,
    private readonly kpiRepo: KpiRepository,
    private readonly datasetRepo: DatasetRepository,
    private readonly reportRepo: ReportRepository,
    private readonly queryRepo: AnalyticsQueryRepository,
  ) {
    this.metricsEngine = new MetricsEngine();
    this.kpiEngine = new KpiEngine();
    this.trendAnalyzer = new TrendAnalyzer();
    this.datasetBuilder = new DatasetBuilder();
    this.reportGenerator = new ReportGenerator();
  }

  async calculateMetric(params: MetricCalculationParams & { metricName: string }): Promise<BusinessMetric> {
    const metric = await this.metricsEngine.calculateMetric(params);
    await this.metricRepo.save(metric);

    const record = this.metricsEngine.createRecord(metric, params.periodStart, params.periodEnd);
    await this.metricRepo.saveRecord(record);

    this.events.push(new MetricCalculated(
      metric.id,
      metric.restaurantId,
      metric.name,
      metric.category,
      metric.value,
      metric.unit,
      metric.period,
    ));

    return metric;
  }

  async calculateMetrics(params: MetricCalculationParams, metricNames?: string[]): Promise<BusinessMetric[]> {
    const metrics = await this.metricsEngine.calculateMetrics(params, metricNames);

    for (const metric of metrics) {
      await this.metricRepo.save(metric);
      const record = this.metricsEngine.createRecord(metric, params.periodStart, params.periodEnd);
      await this.metricRepo.saveRecord(record);

      this.events.push(new MetricCalculated(
        metric.id,
        metric.restaurantId,
        metric.name,
        metric.category,
        metric.value,
        metric.unit,
        metric.period,
      ));
    }

    return metrics;
  }

  async updateKpis(restaurantId: string, period: KpiPeriod, periodStart: Date, periodEnd: Date): Promise<void> {
    const definitions = await this.kpiRepo.findActiveDefinitions(restaurantId);
    const records = await this.metricRepo.findRecordsByRestaurant(restaurantId, periodStart, periodEnd);

    for (const def of definitions) {
      const metricRecords = this.kpiEngine.filterRecordsByMetricName(records, def.metricName);
      const value = this.kpiEngine.calculateValue(def, metricRecords);
      const kpiRecord = this.kpiEngine.createRecord(def, value, period, periodStart, periodEnd);

      await this.kpiRepo.saveRecord(kpiRecord);

      this.events.push(new KpiUpdated(
        kpiRecord.id,
        def.id,
        restaurantId,
        def.name,
        value,
        def.target,
        kpiRecord.variance,
        kpiRecord.status,
        period,
      ));
    }
  }

  async buildDataset(params: DatasetBuildParams, records?: MetricRecord[]): Promise<AnalyticsDataset> {
    const metricRecords = records ?? await this.metricRepo.findRecordsByRestaurant(
      params.restaurantId,
      params.periodStart,
      params.periodEnd,
    );

    let dataset: AnalyticsDataset;
    switch (params.type) {
      case "aggregated":
        dataset = this.datasetBuilder.buildAggregated(params, metricRecords);
        break;
      case "historical":
        dataset = this.datasetBuilder.buildHistorical(params, metricRecords);
        break;
      case "operational":
        dataset = this.datasetBuilder.buildOperational(params, metricRecords);
        break;
      case "analytical":
        dataset = this.datasetBuilder.buildAnalytical(params, metricRecords);
        break;
      default:
        dataset = this.datasetBuilder.buildAggregated(params, metricRecords);
    }

    await this.datasetRepo.save(dataset);

    this.events.push(new AnalyticsDatasetBuilt(
      dataset.id,
      dataset.restaurantId,
      dataset.name,
      dataset.type,
      dataset.dimensions,
      dataset.metrics,
      dataset.recordCount(),
    ));

    return dataset;
  }

  async generateReport(params: ReportGenerationParams, data?: Record<string, unknown>[]): Promise<AnalyticsReport> {
    let report: AnalyticsReport;

    if (data) {
      report = this.reportGenerator.generateFromData(params, data);
    } else {
      const records = await this.metricRepo.findRecordsByRestaurant(
        params.restaurantId,
        params.periodStart ?? new Date(0),
        params.periodEnd ?? new Date(),
      );
      const dataset = await this.buildDataset({
        restaurantId: params.restaurantId,
        name: params.name,
        type: "aggregated",
        dimensions: [],
        metrics: [...new Set(records.map((r) => r.metricName))],
        periodStart: params.periodStart ?? new Date(0),
        periodEnd: params.periodEnd ?? new Date(),
      }, records);
      report = this.reportGenerator.generateFromDataset(params, dataset);
    }

    await this.reportRepo.saveReport(report);

    this.events.push(new ReportGenerated(
      report.id,
      report.restaurantId,
      params.definitionId,
      report.name,
      report.type,
      report.format,
      report.recordCount(),
    ));

    return report;
  }

  async analyzeTrends(restaurantId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    const records = await this.metricRepo.findRecordsByRestaurant(restaurantId, periodStart, periodEnd);
    const trends = this.trendAnalyzer.analyze(records);

    for (const trend of trends) {
      this.events.push(new TrendDetected(
        restaurantId,
        trend.metricName,
        trend.direction,
        trend.currentValue,
        trend.previousValue,
        trend.changePercent,
        "daily",
      ));
    }
  }

  async comparePeriods(
    restaurantId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<void> {
    const currentRecords = await this.metricRepo.findRecordsByRestaurant(restaurantId, currentStart, currentEnd);
    const previousRecords = await this.metricRepo.findRecordsByRestaurant(restaurantId, previousStart, previousEnd);
    this.trendAnalyzer.comparePeriods(currentRecords, previousRecords);
  }

  async createKpiDefinition(definition: KpiDefinition): Promise<void> {
    await this.kpiRepo.saveDefinition(definition);
  }

  async createReportDefinition(definition: ReportDefinition): Promise<void> {
    await this.reportRepo.saveDefinition(definition);
  }

  async saveQuery(query: AnalyticsQuery): Promise<void> {
    await this.queryRepo.save(query);
  }

  async getMetrics(restaurantId: string): Promise<BusinessMetric[]> {
    return this.metricRepo.findByRestaurant(restaurantId);
  }

  async getKpiDefinitions(restaurantId: string): Promise<KpiDefinition[]> {
    return this.kpiRepo.findDefinitionsByRestaurant(restaurantId);
  }

  async getDatasets(restaurantId: string): Promise<AnalyticsDataset[]> {
    return this.datasetRepo.findByRestaurant(restaurantId);
  }

  async getReports(restaurantId: string): Promise<AnalyticsReport[]> {
    return this.reportRepo.findReportsByRestaurant(restaurantId);
  }
}
