export interface AuditSerializer {
  serialize<T extends Record<string, unknown>>(entity: T): Record<string, unknown>;
  diff<T extends Record<string, unknown>>(
    oldValues: T | null,
    newValues: T | null,
  ): { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null };
}
