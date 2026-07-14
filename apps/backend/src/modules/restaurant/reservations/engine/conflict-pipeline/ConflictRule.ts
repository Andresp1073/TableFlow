import type { ConflictResult } from "./ConflictResult.js";

export interface PipelineContext {
  restaurantId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  partySize: number;
  tableId?: string | null;
  tableGroupId?: string | null;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  excludeReservationId?: string;
}

export interface ConflictRule {
  readonly name: string;
  evaluate(context: PipelineContext): Promise<ConflictResult>;
}
