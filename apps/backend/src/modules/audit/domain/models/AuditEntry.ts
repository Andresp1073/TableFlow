import type { AuditAction } from "./AuditAction.js";
import type { AuditModule } from "./AuditModule.js";

export interface AuditEntry {
  id: string;
  organizationId: string;
  module: AuditModule;
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedBy: string | null;
  restaurantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
