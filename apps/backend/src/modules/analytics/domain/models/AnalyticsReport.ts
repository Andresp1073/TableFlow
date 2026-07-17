import type { ReportFormat, ReportType } from "./ReportDefinition.js";

export interface AnalyticsReportConfig {
  id: string;
  restaurantId: string;
  name: string;
  definitionId?: string;
  type: ReportType;
  format: ReportFormat;
  records: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  parameters: Record<string, unknown>;
  generatedAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, unknown>;
}

export class AnalyticsReport {
  private constructor(private readonly config: AnalyticsReportConfig) {}

  static create(config: Omit<AnalyticsReportConfig, "generatedAt">): AnalyticsReport {
    return new AnalyticsReport({ ...config, generatedAt: new Date() });
  }

  static reconstitute(config: AnalyticsReportConfig): AnalyticsReport {
    return new AnalyticsReport(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get name(): string { return this.config.name; }
  get definitionId(): string | undefined { return this.config.definitionId; }
  get type(): ReportType { return this.config.type; }
  get format(): ReportFormat { return this.config.format; }
  get data(): Record<string, unknown>[] { return this.config.records; }
  get summary(): Record<string, unknown> | undefined { return this.config.summary; }
  get parameters(): Record<string, unknown> { return this.config.parameters; }
  get generatedAt(): Date { return this.config.generatedAt; }
  get periodStart(): Date | undefined { return this.config.periodStart; }
  get periodEnd(): Date | undefined { return this.config.periodEnd; }

  equals(other: AnalyticsReport): boolean {
    return this.config.id === other.config.id;
  }

  recordCount(): number {
    return this.config.records.length;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      format: this.config.format,
      recordCount: this.config.records.length,
      summary: this.config.summary,
      generatedAt: this.config.generatedAt.toISOString(),
      data: this.config.records,
    };
  }

  toCSV(): string {
    if (this.config.records.length === 0) return "";
    const headers = Object.keys(this.config.records[0]);
    const rows = this.config.records.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
}
