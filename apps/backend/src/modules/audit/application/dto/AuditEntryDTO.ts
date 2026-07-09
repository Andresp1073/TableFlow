export interface AuditEntryDTO {
  id: string;
  organizationId: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  restaurantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedAuditEntryDTO {
  items: AuditEntryDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
