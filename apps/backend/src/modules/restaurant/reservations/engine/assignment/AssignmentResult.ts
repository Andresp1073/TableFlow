export type AssignmentStatus = "assigned" | "not_assigned";

export interface AssignmentResult {
  status: AssignmentStatus;
  tableId: string | null;
  tableGroupId: string | null;
  reason: string | null;
  score: number | null;
  metadata: Record<string, unknown> | null;
}

export function assigned(tableId: string, score?: number, metadata?: Record<string, unknown>): AssignmentResult {
  return {
    status: "assigned",
    tableId,
    tableGroupId: null,
    reason: null,
    score: score ?? null,
    metadata: metadata ?? null,
  };
}

export function assignedGroup(tableGroupId: string, score?: number, metadata?: Record<string, unknown>): AssignmentResult {
  return {
    status: "assigned",
    tableId: null,
    tableGroupId,
    reason: null,
    score: score ?? null,
    metadata: metadata ?? null,
  };
}

export function notAssigned(reason: string, metadata?: Record<string, unknown>): AssignmentResult {
  return {
    status: "not_assigned",
    tableId: null,
    tableGroupId: null,
    reason,
    score: null,
    metadata: metadata ?? null,
  };
}
