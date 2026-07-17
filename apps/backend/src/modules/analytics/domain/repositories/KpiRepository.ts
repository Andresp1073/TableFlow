import type { KpiDefinition } from "../models/KpiDefinition.js";
import type { KpiRecord } from "../models/KpiRecord.js";
import type { KpiPeriod } from "../models/KpiDefinition.js";

export interface KpiRepository {
  saveDefinition(definition: KpiDefinition): Promise<void>;
  saveRecord(record: KpiRecord): Promise<void>;
  findDefinitionById(id: string): Promise<KpiDefinition | null>;
  findDefinitionsByRestaurant(restaurantId: string): Promise<KpiDefinition[]>;
  findActiveDefinitions(restaurantId: string): Promise<KpiDefinition[]>;
  findRecordsByDefinition(
    definitionId: string,
    limit?: number,
  ): Promise<KpiRecord[]>;
  findLatestRecord(definitionId: string): Promise<KpiRecord | null>;
  findRecordsByPeriod(
    restaurantId: string,
    period: KpiPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<KpiRecord[]>;
  deleteDefinition(id: string): Promise<void>;
}
