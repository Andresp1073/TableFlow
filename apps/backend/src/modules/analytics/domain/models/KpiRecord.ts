import type { KpiPeriod, KpiStatus } from "./KpiDefinition.js";

export interface KpiRecordConfig {
  id: string;
  kpiDefinitionId: string;
  restaurantId: string;
  value: number;
  target: number;
  variance: number;
  status: KpiStatus;
  period: KpiPeriod;
  periodStart: Date;
  periodEnd: Date;
  recordedAt: Date;
  metadata?: Record<string, unknown>;
}

export class KpiRecord {
  private constructor(public readonly data: KpiRecordConfig) {}

  static create(config: Omit<KpiRecordConfig, "recordedAt">): KpiRecord {
    return new KpiRecord({ ...config, recordedAt: new Date() });
  }

  static reconstitute(config: KpiRecordConfig): KpiRecord {
    return new KpiRecord(config);
  }

  get id(): string { return this.data.id; }
  get kpiDefinitionId(): string { return this.data.kpiDefinitionId; }
  get restaurantId(): string { return this.data.restaurantId; }
  get value(): number { return this.data.value; }
  get target(): number { return this.data.target; }
  get variance(): number { return this.data.variance; }
  get status(): KpiStatus { return this.data.status; }
  get period(): KpiPeriod { return this.data.period; }
  get periodStart(): Date { return this.data.periodStart; }
  get periodEnd(): Date { return this.data.periodEnd; }
  get recordedAt(): Date { return this.data.recordedAt; }

  equals(other: KpiRecord): boolean {
    return this.data.id === other.data.id;
  }

  isOnTrack(): boolean {
    return this.data.status === "on_track" || this.data.status === "exceeded";
  }
}
