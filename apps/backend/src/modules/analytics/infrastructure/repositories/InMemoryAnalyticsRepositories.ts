import type { MetricRepository } from "../../domain/repositories/MetricRepository.js";
import type { KpiRepository } from "../../domain/repositories/KpiRepository.js";
import type { DatasetRepository } from "../../domain/repositories/DatasetRepository.js";
import type { ReportRepository } from "../../domain/repositories/ReportRepository.js";
import type { AnalyticsQueryRepository } from "../../domain/repositories/AnalyticsQueryRepository.js";
import type { BusinessMetric, MetricPeriod } from "../../domain/models/BusinessMetric.js";
import type { MetricRecord } from "../../domain/models/MetricRecord.js";
import type { KpiDefinition, KpiPeriod } from "../../domain/models/KpiDefinition.js";
import type { KpiRecord } from "../../domain/models/KpiRecord.js";
import type { AnalyticsDataset, DatasetType } from "../../domain/models/AnalyticsDataset.js";
import type { ReportDefinition, ReportType, ReportFormat } from "../../domain/models/ReportDefinition.js";
import type { AnalyticsReport } from "../../domain/models/AnalyticsReport.js";
import type { AnalyticsQuery } from "../../domain/models/AnalyticsQuery.js";

export class InMemoryMetricRepository implements MetricRepository {
  private readonly metrics = new Map<string, BusinessMetric>();
  private readonly records: MetricRecord[] = [];

  async save(metric: BusinessMetric): Promise<void> {
    this.metrics.set(metric.id, metric);
  }

  async saveRecord(record: MetricRecord): Promise<void> {
    this.records.push(record);
  }

  async findById(id: string): Promise<BusinessMetric | null> {
    return this.metrics.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<BusinessMetric[]> {
    return Array.from(this.metrics.values()).filter((m) => m.restaurantId === restaurantId);
  }

  async findRecordsByRestaurant(restaurantId: string, periodStart: Date, periodEnd: Date): Promise<MetricRecord[]> {
    return this.records.filter(
      (r) =>
        r.restaurantId === restaurantId &&
        r.recordedAt >= periodStart &&
        r.recordedAt <= periodEnd,
    );
  }

  async findRecordsByMetricName(restaurantId: string, metricName: string, periodStart: Date, periodEnd: Date): Promise<MetricRecord[]> {
    return this.records.filter(
      (r) =>
        r.restaurantId === restaurantId &&
        r.metricName === metricName &&
        r.recordedAt >= periodStart &&
        r.recordedAt <= periodEnd,
    );
  }

  async findByCategory(restaurantId: string, category: string): Promise<BusinessMetric[]> {
    return Array.from(this.metrics.values()).filter(
      (m) => m.restaurantId === restaurantId && m.category === category,
    );
  }

  async findByPeriod(restaurantId: string, period: MetricPeriod): Promise<BusinessMetric[]> {
    return Array.from(this.metrics.values()).filter(
      (m) => m.restaurantId === restaurantId && m.period === period,
    );
  }

  async delete(id: string): Promise<void> {
    this.metrics.delete(id);
  }

  clear(): void {
    this.metrics.clear();
    this.records.length = 0;
  }
}

export class InMemoryKpiRepository implements KpiRepository {
  private readonly definitions = new Map<string, KpiDefinition>();
  private readonly records: KpiRecord[] = [];

  async saveDefinition(definition: KpiDefinition): Promise<void> {
    this.definitions.set(definition.id, definition);
  }

  async saveRecord(record: KpiRecord): Promise<void> {
    this.records.push(record);
  }

  async findDefinitionById(id: string): Promise<KpiDefinition | null> {
    return this.definitions.get(id) ?? null;
  }

  async findDefinitionsByRestaurant(restaurantId: string): Promise<KpiDefinition[]> {
    return Array.from(this.definitions.values()).filter((d) => d.restaurantId === restaurantId);
  }

  async findActiveDefinitions(restaurantId: string): Promise<KpiDefinition[]> {
    return Array.from(this.definitions.values()).filter(
      (d) => d.restaurantId === restaurantId && d.isActive,
    );
  }

  async findRecordsByDefinition(definitionId: string, limit?: number): Promise<KpiRecord[]> {
    const records = this.records.filter((r) => r.kpiDefinitionId === definitionId);
    return limit ? records.slice(-limit) : records;
  }

  async findLatestRecord(definitionId: string): Promise<KpiRecord | null> {
    const records = this.records.filter((r) => r.kpiDefinitionId === definitionId);
    return records.length > 0 ? records[records.length - 1] : null;
  }

  async findRecordsByPeriod(restaurantId: string, period: KpiPeriod, periodStart: Date, periodEnd: Date): Promise<KpiRecord[]> {
    return this.records.filter(
      (r) =>
        r.restaurantId === restaurantId &&
        r.period === period &&
        r.periodStart >= periodStart &&
        r.periodEnd <= periodEnd,
    );
  }

  async deleteDefinition(id: string): Promise<void> {
    this.definitions.delete(id);
  }

  clear(): void {
    this.definitions.clear();
    this.records.length = 0;
  }
}

export class InMemoryDatasetRepository implements DatasetRepository {
  private readonly datasets = new Map<string, AnalyticsDataset>();

  async save(dataset: AnalyticsDataset): Promise<void> {
    this.datasets.set(dataset.id, dataset);
  }

  async findById(id: string): Promise<AnalyticsDataset | null> {
    return this.datasets.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<AnalyticsDataset[]> {
    return Array.from(this.datasets.values()).filter((d) => d.restaurantId === restaurantId);
  }

  async findByType(restaurantId: string, type: DatasetType): Promise<AnalyticsDataset[]> {
    return Array.from(this.datasets.values()).filter(
      (d) => d.restaurantId === restaurantId && d.type === type,
    );
  }

  async findByName(restaurantId: string, name: string): Promise<AnalyticsDataset | null> {
    return Array.from(this.datasets.values()).find(
      (d) => d.restaurantId === restaurantId && d.name === name,
    ) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.datasets.delete(id);
  }

  clear(): void {
    this.datasets.clear();
  }
}

export class InMemoryReportRepository implements ReportRepository {
  private readonly definitions = new Map<string, ReportDefinition>();
  private readonly reports: AnalyticsReport[] = [];

  async saveDefinition(definition: ReportDefinition): Promise<void> {
    this.definitions.set(definition.id, definition);
  }

  async saveReport(report: AnalyticsReport): Promise<void> {
    this.reports.push(report);
  }

  async findDefinitionById(id: string): Promise<ReportDefinition | null> {
    return this.definitions.get(id) ?? null;
  }

  async findDefinitionsByRestaurant(restaurantId: string): Promise<ReportDefinition[]> {
    return Array.from(this.definitions.values()).filter((d) => d.restaurantId === restaurantId);
  }

  async findActiveDefinitions(restaurantId: string): Promise<ReportDefinition[]> {
    return Array.from(this.definitions.values()).filter(
      (d) => d.restaurantId === restaurantId && d.isActive,
    );
  }

  async findScheduledDefinitions(): Promise<ReportDefinition[]> {
    return Array.from(this.definitions.values()).filter((d) => d.isScheduled());
  }

  async findReportById(id: string): Promise<AnalyticsReport | null> {
    return this.reports.find((r) => r.id === id) ?? null;
  }

  async findReportsByRestaurant(restaurantId: string): Promise<AnalyticsReport[]> {
    return this.reports.filter((r) => r.restaurantId === restaurantId);
  }

  async findReportsByDefinition(definitionId: string): Promise<AnalyticsReport[]> {
    return this.reports.filter((r) => r.definitionId === definitionId);
  }

  async findReportsByType(restaurantId: string, type: ReportType): Promise<AnalyticsReport[]> {
    return this.reports.filter((r) => r.restaurantId === restaurantId && r.type === type);
  }

  async deleteDefinition(id: string): Promise<void> {
    this.definitions.delete(id);
  }

  async deleteReport(id: string): Promise<void> {
    const index = this.reports.findIndex((r) => r.id === id);
    if (index >= 0) this.reports.splice(index, 1);
  }

  clear(): void {
    this.definitions.clear();
    this.reports.length = 0;
  }
}

export class InMemoryAnalyticsQueryRepository implements AnalyticsQueryRepository {
  private readonly queries = new Map<string, AnalyticsQuery>();

  async save(query: AnalyticsQuery): Promise<void> {
    this.queries.set(query.id, query);
  }

  async findById(id: string): Promise<AnalyticsQuery | null> {
    return this.queries.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<AnalyticsQuery[]> {
    return Array.from(this.queries.values()).filter((q) => q.restaurantId === restaurantId);
  }

  async delete(id: string): Promise<void> {
    this.queries.delete(id);
  }

  clear(): void {
    this.queries.clear();
  }
}
