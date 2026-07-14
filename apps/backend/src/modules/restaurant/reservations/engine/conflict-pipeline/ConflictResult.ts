export type ConflictSeverity = "info" | "warning" | "blocking";

export interface ConflictResult {
  isConflict: boolean;
  severity: ConflictSeverity;
  reason: string | null;
  code: string | null;
  metadata?: Record<string, unknown>;
}

export function noConflict(): ConflictResult {
  return {
    isConflict: false,
    severity: "info",
    reason: null,
    code: null,
  };
}

export function blockingConflict(code: string, reason: string, metadata?: Record<string, unknown>): ConflictResult {
  return {
    isConflict: true,
    severity: "blocking",
    reason,
    code,
    metadata,
  };
}

export function warningConflict(code: string, reason: string, metadata?: Record<string, unknown>): ConflictResult {
  return {
    isConflict: true,
    severity: "warning",
    reason,
    code,
    metadata,
  };
}

export function infoConflict(code: string, reason: string, metadata?: Record<string, unknown>): ConflictResult {
  return {
    isConflict: true,
    severity: "info",
    reason,
    code,
    metadata,
  };
}
