import type { AuditEntry } from "../models/AuditEntry.js";

export interface AuditSearchCriteria {
  organizationId: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  performedBy?: string;
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditRepository {
  save(entry: AuditEntry): Promise<AuditEntry>;
  findById(id: string): Promise<AuditEntry | null>;
  search(criteria: AuditSearchCriteria): Promise<PaginatedResult<AuditEntry>>;
  findByOrganizationAndDateRange(
    organizationId: string,
    startDate: string,
    endDate: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<AuditEntry>>;
}
