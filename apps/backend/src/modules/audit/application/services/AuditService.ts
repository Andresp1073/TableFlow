import type { AuditEntryDTO } from "../dto/AuditEntryDTO.js";

export interface AuditRecordInput {
  organizationId: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy?: string | null;
  restaurantId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditService {
  record(input: AuditRecordInput): Promise<void>;
}
