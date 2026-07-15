import type { DashboardDefinitionConfig, DashboardType, DashboardSection, DashboardResult } from "./types.js";
import { DASHBOARD_TYPES } from "./types.js";
import { MonitoringValidationError } from "./errors.js";

export class DashboardDefinition {
  readonly name: string;
  readonly type: DashboardType;
  readonly title: string;
  readonly description: string;
  readonly sections: readonly DashboardSection[];
  readonly tags: readonly string[];
  readonly timeRangeDefaultMs: number;
  readonly autoRefreshMs: number;

  constructor(config: DashboardDefinitionConfig) {
    DashboardDefinition.validate(config);

    this.name = config.name;
    this.type = config.type;
    this.title = config.title;
    this.description = config.description ?? "";
    this.sections = Object.freeze([...config.sections]);
    this.tags = Object.freeze([...(config.tags ?? [])]);
    this.timeRangeDefaultMs = config.timeRangeDefaultMs ?? 3_600_000;
    this.autoRefreshMs = config.autoRefreshMs ?? 30_000;
  }

  private static validate(config: DashboardDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Dashboard name is required");
    }

    if (!DASHBOARD_TYPES.includes(config.type)) {
      errors.push(`Invalid dashboard type: ${config.type}`);
    }

    if (!config.sections || config.sections.length === 0) {
      errors.push("At least one dashboard section is required");
    }

    if (errors.length > 0) {
      throw new MonitoringValidationError("Invalid dashboard definition", errors);
    }
  }

  toConfig(): DashboardDefinitionConfig {
    return {
      name: this.name,
      type: this.type,
      title: this.title,
      description: this.description,
      sections: [...this.sections],
      tags: [...this.tags],
      timeRangeDefaultMs: this.timeRangeDefaultMs,
      autoRefreshMs: this.autoRefreshMs,
    };
  }

  toResult(): DashboardResult {
    return {
      name: this.name,
      type: this.type,
      title: this.title,
      sections: [...this.sections],
      tags: [...this.tags],
    };
  }

  static createPlatform(name: string, sections: DashboardSection[]): DashboardDefinition {
    return new DashboardDefinition({
      name,
      type: "platform",
      title: "Platform Overview",
      description: "High-level platform health and performance",
      sections,
      tags: ["platform", "overview"],
      timeRangeDefaultMs: 3_600_000,
      autoRefreshMs: 30_000,
    });
  }

  static createApplication(name: string, sections: DashboardSection[]): DashboardDefinition {
    return new DashboardDefinition({
      name,
      type: "application",
      title: "Application Performance",
      description: "Application-level metrics and traces",
      sections,
      tags: ["application", "performance"],
      timeRangeDefaultMs: 1_800_000,
      autoRefreshMs: 15_000,
    });
  }

  static createInfrastructure(name: string, sections: DashboardSection[]): DashboardDefinition {
    return new DashboardDefinition({
      name,
      type: "infrastructure",
      title: "Infrastructure Health",
      description: "Infrastructure resource utilization and health",
      sections,
      tags: ["infrastructure", "resources"],
      timeRangeDefaultMs: 3_600_000,
      autoRefreshMs: 60_000,
    });
  }

  static createBusiness(name: string, sections: DashboardSection[]): DashboardDefinition {
    return new DashboardDefinition({
      name,
      type: "business",
      title: "Business Metrics",
      description: "Business-level KPIs and growth metrics",
      sections,
      tags: ["business", "kpi"],
      timeRangeDefaultMs: 86_400_000,
      autoRefreshMs: 300_000,
    });
  }
}
