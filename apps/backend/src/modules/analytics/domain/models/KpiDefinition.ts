export interface KpiDefinitionConfig {
  id: string;
  restaurantId: string;
  name: string;
  metricName: string;
  formula: KpiFormula;
  target: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  period: KpiPeriod;
  direction: KpiDirection;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export type KpiFormula =
  | "direct"
  | "average"
  | "sum"
  | "ratio"
  | "percentage"
  | "year_over_year"
  | "week_over_week"
  | "month_over_month"
  | "custom";

export type KpiPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom"
  | "comparative";

export type KpiDirection =
  | "higher_is_better"
  | "lower_is_better"
  | "target_is_best";

export type KpiStatus =
  | "on_track"
  | "warning"
  | "critical"
  | "exceeded";

export class KpiDefinition {
  private constructor(public readonly data: KpiDefinitionConfig) {}

  static create(config: Omit<KpiDefinitionConfig, "isActive">): KpiDefinition {
    return new KpiDefinition({ ...config, isActive: true });
  }

  static reconstitute(config: KpiDefinitionConfig): KpiDefinition {
    return new KpiDefinition(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get metricName(): string { return this.data.metricName; }
  get formula(): KpiFormula { return this.data.formula; }
  get target(): number { return this.data.target; }
  get warningThreshold(): number { return this.data.warningThreshold; }
  get criticalThreshold(): number { return this.data.criticalThreshold; }
  get unit(): string { return this.data.unit; }
  get period(): KpiPeriod { return this.data.period; }
  get direction(): KpiDirection { return this.data.direction; }
  get isActive(): boolean { return this.data.isActive; }

  equals(other: KpiDefinition): boolean {
    return this.data.id === other.data.id;
  }

  evaluateStatus(actualValue: number): KpiStatus {
    if (this.direction === "higher_is_better" && actualValue >= this.target) return "exceeded";
    if (this.direction === "lower_is_better" && actualValue <= this.target) return "exceeded";

    const variance = this.calculateVariance(actualValue);
    const absVariance = Math.abs(variance);

    if (absVariance >= this.criticalThreshold) return "critical";
    if (absVariance >= this.warningThreshold) return "warning";

    return "on_track";
  }

  calculateVariance(actualValue: number): number {
    if (this.target === 0) return 0;
    return (actualValue - this.target) / this.target;
  }

  deactivate(): KpiDefinition {
    return new KpiDefinition({ ...this.data, isActive: false });
  }

  activate(): KpiDefinition {
    return new KpiDefinition({ ...this.data, isActive: true });
  }
}
