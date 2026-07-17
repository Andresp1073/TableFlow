import type { ReportDefinition } from "../models/ReportDefinition.js";
import type { AnalyticsReport } from "../models/AnalyticsReport.js";
import type { ReportType, ReportFormat } from "../models/ReportDefinition.js";

export interface ReportRepository {
  saveDefinition(definition: ReportDefinition): Promise<void>;
  saveReport(report: AnalyticsReport): Promise<void>;
  findDefinitionById(id: string): Promise<ReportDefinition | null>;
  findDefinitionsByRestaurant(restaurantId: string): Promise<ReportDefinition[]>;
  findActiveDefinitions(restaurantId: string): Promise<ReportDefinition[]>;
  findScheduledDefinitions(): Promise<ReportDefinition[]>;
  findReportById(id: string): Promise<AnalyticsReport | null>;
  findReportsByRestaurant(restaurantId: string): Promise<AnalyticsReport[]>;
  findReportsByDefinition(definitionId: string): Promise<AnalyticsReport[]>;
  findReportsByType(restaurantId: string, type: ReportType): Promise<AnalyticsReport[]>;
  deleteDefinition(id: string): Promise<void>;
  deleteReport(id: string): Promise<void>;
}
