import type { AuditEntry } from "../../domain/models/AuditEntry.js";
import type { AuditEntryDTO, PaginatedAuditEntryDTO } from "./AuditEntryDTO.js";
import type { PaginatedResult } from "../../domain/repositories/AuditRepository.js";

export class AuditEntryMapper {
  static toDTO(entry: AuditEntry): AuditEntryDTO {
    return {
      id: entry.id,
      organizationId: entry.organizationId,
      module: entry.module.value,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action.value,
      performedBy: entry.performedBy,
      restaurantId: entry.restaurantId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  static toDTOList(entries: AuditEntry[]): AuditEntryDTO[] {
    return entries.map((e) => this.toDTO(e));
  }

  static toPaginatedDTO(result: PaginatedResult<AuditEntry>): PaginatedAuditEntryDTO {
    return {
      items: this.toDTOList(result.items),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
