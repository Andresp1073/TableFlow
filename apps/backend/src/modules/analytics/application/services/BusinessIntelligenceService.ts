import type { MetricRepository } from "../../domain/repositories/MetricRepository.js";
import type { KpiRepository } from "../../domain/repositories/KpiRepository.js";
import type { DatasetRepository } from "../../domain/repositories/DatasetRepository.js";
import type { ReportRepository } from "../../domain/repositories/ReportRepository.js";
import type { AnalyticsQueryRepository } from "../../domain/repositories/AnalyticsQueryRepository.js";
import { AnalyticsManager } from "../../domain/services/AnalyticsManager.js";
import { MetricsEngine, type MetricCalculationParams } from "../../domain/services/MetricsEngine.js";
import { KpiDefinition, type KpiPeriod } from "../../domain/models/KpiDefinition.js";
import { AnalyticsDataset, type DatasetType } from "../../domain/models/AnalyticsDataset.js";
import { ReportDefinition, type ReportFormat, type ReportType, type ReportFilter } from "../../domain/models/ReportDefinition.js";
import { AnalyticsReport } from "../../domain/models/AnalyticsReport.js";
import { AnalyticsQuery } from "../../domain/models/AnalyticsQuery.js";
import { BusinessMetric, type MetricCategory, type MetricUnit } from "../../domain/models/BusinessMetric.js";
import { BusinessDimension, type DimensionType } from "../../domain/models/BusinessDimension.js";
import type { KpiRecord } from "../../domain/models/KpiRecord.js";
import type { MetricRecord } from "../../domain/models/MetricRecord.js";
import type { QueryComparison, QueryOrderBy } from "../../domain/models/AnalyticsQuery.js";
import { toMetricDto, type MetricDto } from "../dtos/MetricDto.js";
import { toKpiDefinitionDto, toKpiRecordDto, type KpiDefinitionDto, type KpiRecordDto } from "../dtos/KpiDto.js";
import { toDatasetDto, type DatasetDto } from "../dtos/DatasetDto.js";
import { toReportDto, toReportDetailDto, type ReportDto, type ReportDetailDto } from "../dtos/ReportDto.js";
import { toAnalyticsQueryDto, type AnalyticsQueryDto, type CreateAnalyticsQueryDto } from "../dtos/AnalyticsQueryDto.js";

export class BusinessIntelligenceService {
  private readonly manager: AnalyticsManager;

  constructor(
    metricRepo: MetricRepository,
    kpiRepo: KpiRepository,
    datasetRepo: DatasetRepository,
    reportRepo: ReportRepository,
    queryRepo: AnalyticsQueryRepository,
  ) {
    this.manager = new AnalyticsManager(metricRepo, kpiRepo, datasetRepo, reportRepo, queryRepo);
  }

  getAnalyticsManager(): AnalyticsManager {
    return this.manager;
  }

  async calculateMetrics(restaurantId: string, periodStart: Date, periodEnd: Date, metricNames?: string[]): Promise<MetricDto[]> {
    const params: MetricCalculationParams = { restaurantId, periodStart, periodEnd };
    const metrics = await this.manager.calculateMetrics(params, metricNames);
    return metrics.map(toMetricDto);
  }

  async createKpiDefinition(
    restaurantId: string,
    name: string,
    metricName: string,
    formula: string,
    target: number,
    warningThreshold: number,
    criticalThreshold: number,
    unit: string,
    period: KpiPeriod,
    direction: string,
  ): Promise<KpiDefinitionDto> {
    const def = KpiDefinition.create({
      id: crypto.randomUUID(),
      restaurantId,
      name,
      metricName,
      formula: formula as KpiDefinition["data"]["formula"],
      target,
      warningThreshold,
      criticalThreshold,
      unit,
      period: period as KpiDefinition["data"]["period"],
      direction: direction as KpiDefinition["data"]["direction"],
    });
    await this.manager.createKpiDefinition(def);
    return toKpiDefinitionDto(def);
  }

  async updateKpis(restaurantId: string, period: KpiPeriod, periodStart: Date, periodEnd: Date): Promise<KpiRecordDto[]> {
    const definitions = await this.manager.kpiRepo.findActiveDefinitions(restaurantId);
    const records = await this.manager.metricRepo.findRecordsByRestaurant(restaurantId, periodStart, periodEnd);
    const results: KpiRecordDto[] = [];

    for (const def of definitions) {
      const metricRecords = this.manager.kpiEngine.filterRecordsByMetricName(records, def.metricName);
      const value = this.manager.kpiEngine.calculateValue(def, metricRecords);
      const kpiRecord = this.manager.kpiEngine.createRecord(def, value, period, periodStart, periodEnd);
      await this.manager.kpiRepo.saveRecord(kpiRecord);
      results.push(toKpiRecordDto(kpiRecord));
    }

    return results;
  }

  async buildDataset(
    restaurantId: string,
    name: string,
    type: DatasetType,
    dimensions: string[],
    metrics: string[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DatasetDto> {
    const dataset = await this.manager.buildDataset({
      restaurantId, name, type, dimensions, metrics, periodStart, periodEnd,
    });
    return toDatasetDto(dataset);
  }

  async generateReport(
    restaurantId: string,
    name: string,
    format: ReportFormat,
    parameters: Record<string, unknown>,
    data?: Record<string, unknown>[],
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<ReportDetailDto> {
    const report = await this.manager.generateReport({
      restaurantId, name, format, parameters, periodStart, periodEnd,
    }, data);
    return toReportDetailDto(report);
  }

  async createReportDefinition(
    restaurantId: string,
    name: string,
    metrics: string[],
    dimensions: string[],
    format: ReportFormat,
    type: ReportType,
    filters?: ReportFilter[],
    schedule?: { cron: string; timezone: string; period: KpiPeriod },
  ): Promise<void> {
    const def = ReportDefinition.create({
      id: crypto.randomUUID(),
      restaurantId,
      name,
      metrics,
      dimensions,
      filters: filters ?? [],
      format,
      type,
      schedule: schedule ? {
        cron: schedule.cron,
        timezone: schedule.timezone,
        period: schedule.period as KpiPeriod,
      } : undefined,
    });
    await this.manager.createReportDefinition(def);
  }

  async createQuery(restaurantId: string, dto: CreateAnalyticsQueryDto): Promise<AnalyticsQueryDto> {
    const query = AnalyticsQuery.create({
      id: crypto.randomUUID(),
      restaurantId,
      name: dto.name,
      metrics: dto.metrics,
      dimensions: dto.dimensions,
      filters: dto.filters,
      period: dto.period,
      periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
      comparison: dto.comparison,
      groupBy: dto.groupBy,
      orderBy: dto.orderBy,
      limit: dto.limit,
    });
    await this.manager.saveQuery(query);
    return toAnalyticsQueryDto(query);
  }

  async getMetrics(restaurantId: string): Promise<MetricDto[]> {
    const metrics = await this.manager.getMetrics(restaurantId);
    return metrics.map(toMetricDto);
  }

  async getKpiDefinitions(restaurantId: string): Promise<KpiDefinitionDto[]> {
    const defs = await this.manager.getKpiDefinitions(restaurantId);
    return defs.map(toKpiDefinitionDto);
  }

  async getDatasets(restaurantId: string): Promise<DatasetDto[]> {
    const datasets = await this.manager.getDatasets(restaurantId);
    return datasets.map(toDatasetDto);
  }

  async getReports(restaurantId: string): Promise<ReportDto[]> {
    const reports = await this.manager.getReports(restaurantId);
    return reports.map(toReportDto);
  }

  async analyzeTrends(restaurantId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    await this.manager.analyzeTrends(restaurantId, periodStart, periodEnd);
  }

  registerMetricProvider(metricName: string, provider: (params: MetricCalculationParams) => Promise<{ name: string; category: MetricCategory; value: number; unit: MetricUnit; period: KpiPeriod }>): void {
    this.manager.metricsEngine.registerProvider(metricName, provider);
  }
}
