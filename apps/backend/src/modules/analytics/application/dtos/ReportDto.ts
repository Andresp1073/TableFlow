import type { AnalyticsReport } from "../../domain/models/AnalyticsReport.js";
import type { ReportFormat, ReportType } from "../../domain/models/ReportDefinition.js";

export interface ReportDto {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  recordCount: number;
  generatedAt: string;
  summary?: Record<string, unknown>;
}

export interface ReportDetailDto extends ReportDto {
  data: Record<string, unknown>[];
  parameters: Record<string, unknown>;
  periodStart?: string;
  periodEnd?: string;
}

export function toReportDto(report: AnalyticsReport): ReportDto {
  return {
    id: report.id,
    name: report.name,
    type: report.type,
    format: report.format,
    recordCount: report.recordCount(),
    generatedAt: report.generatedAt.toISOString(),
    summary: report.summary,
  };
}

export function toReportDetailDto(report: AnalyticsReport): ReportDetailDto {
  return {
    ...toReportDto(report),
    data: report.data,
    parameters: report.parameters,
    periodStart: report.periodStart?.toISOString(),
    periodEnd: report.periodEnd?.toISOString(),
  };
}
