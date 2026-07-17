import type { KpiDefinition } from "../../domain/models/KpiDefinition.js";
import type { KpiRecord } from "../../domain/models/KpiRecord.js";

export interface KpiDefinitionDto {
  id: string;
  name: string;
  metricName: string;
  formula: string;
  target: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  period: string;
  direction: string;
  isActive: boolean;
}

export interface KpiRecordDto {
  id: string;
  kpiDefinitionId: string;
  value: number;
  target: number;
  variance: number;
  status: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  recordedAt: string;
  isOnTrack: boolean;
}

export function toKpiDefinitionDto(def: KpiDefinition): KpiDefinitionDto {
  return {
    id: def.id,
    name: def.name,
    metricName: def.metricName,
    formula: def.data.formula,
    target: def.target,
    warningThreshold: def.warningThreshold,
    criticalThreshold: def.criticalThreshold,
    unit: def.unit,
    period: def.data.period,
    direction: def.data.direction,
    isActive: def.isActive,
  };
}

export function toKpiRecordDto(record: KpiRecord): KpiRecordDto {
  return {
    id: record.id,
    kpiDefinitionId: record.kpiDefinitionId,
    value: record.value,
    target: record.target,
    variance: record.variance,
    status: record.status,
    period: record.period,
    periodStart: record.periodStart.toISOString(),
    periodEnd: record.periodEnd.toISOString(),
    recordedAt: record.recordedAt.toISOString(),
    isOnTrack: record.isOnTrack(),
  };
}
