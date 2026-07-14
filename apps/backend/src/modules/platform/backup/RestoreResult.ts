import type { RestoreResult as RestoreResultInterface, RestoreType } from "./types.js";

let restoreResultCounter = 0;

export function generateRestoreResultId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (restoreResultCounter++).toString(36).padStart(4, "0");
  return `rr_${timestamp}${counter}`;
}

export function buildRestoreResult(
  backupId: string,
  name: string,
  type: RestoreType,
  status: RestoreResultInterface["status"],
  options?: {
    entriesRestored?: number;
    entriesFailed?: number;
    failedEntries?: string[];
    durationMs?: number;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    destinationBucket?: string;
    destinationPath?: string;
  },
): RestoreResultInterface {
  const startedAt = options?.startedAt ?? new Date();
  const completedAt = options?.completedAt ?? new Date();
  const durationMs = options?.durationMs ?? completedAt.getTime() - startedAt.getTime();

  return {
    restoreId: generateRestoreResultId(),
    backupId,
    name,
    type,
    status,
    entriesRestored: options?.entriesRestored ?? 0,
    entriesFailed: options?.entriesFailed ?? 0,
    failedEntries: options?.failedEntries ?? [],
    durationMs,
    error: options?.error,
    startedAt,
    completedAt,
    destinationBucket: options?.destinationBucket,
    destinationPath: options?.destinationPath,
  };
}
