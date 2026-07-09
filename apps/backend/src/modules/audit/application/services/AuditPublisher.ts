import type { AuditEntry } from "../../domain/models/AuditEntry.js";

export interface AuditPublisher {
  publish(entry: AuditEntry): Promise<void>;
}
