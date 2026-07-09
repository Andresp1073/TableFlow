import type { AuditEntry } from "../models/AuditEntry.js";
import type { AuditAction } from "../models/AuditAction.js";
import type { AuditModule } from "../models/AuditModule.js";

export interface CreateAuditEntryData {
  organizationId: string;
  module: AuditModule;
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedBy?: string | null;
  restaurantId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface ReconstituteAuditEntryData {
  id: string;
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
  createdAt: Date;
}

export interface AuditFactory {
  create(data: CreateAuditEntryData): AuditEntry;
  reconstitute(data: ReconstituteAuditEntryData): AuditEntry;
}
