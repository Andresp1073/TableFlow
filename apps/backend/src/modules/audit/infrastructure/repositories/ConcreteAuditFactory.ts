import { randomUUID } from "node:crypto";
import type { AuditEntry } from "../../domain/models/AuditEntry.js";
import type { AuditAction } from "../../domain/models/AuditAction.js";
import type { AuditModule } from "../../domain/models/AuditModule.js";
import { AuditAction as AuditActionVO } from "../../domain/models/AuditAction.js";
import { AuditModule as AuditModuleVO } from "../../domain/models/AuditModule.js";
import type { AuditFactory, CreateAuditEntryData, ReconstituteAuditEntryData } from "../../domain/repositories/AuditFactory.js";

export class ConcreteAuditFactory implements AuditFactory {
  create(data: CreateAuditEntryData): AuditEntry {
    const now = new Date();
    return {
      id: randomUUID(),
      organizationId: data.organizationId,
      module: data.module,
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      performedBy: data.performedBy ?? null,
      restaurantId: data.restaurantId ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      requestId: data.requestId ?? null,
      oldValues: data.oldValues ?? null,
      newValues: data.newValues ?? null,
      metadata: data.metadata ?? null,
      createdAt: now,
    };
  }

  reconstitute(data: ReconstituteAuditEntryData): AuditEntry {
    return {
      id: data.id,
      organizationId: data.organizationId,
      module: AuditModuleVO.reconstitute(data.module),
      entityType: data.entityType,
      entityId: data.entityId,
      action: AuditActionVO.reconstitute(data.action),
      performedBy: data.performedBy ?? null,
      restaurantId: data.restaurantId ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      requestId: data.requestId ?? null,
      oldValues: data.oldValues ?? null,
      newValues: data.newValues ?? null,
      metadata: data.metadata ?? null,
      createdAt: data.createdAt,
    };
  }
}
