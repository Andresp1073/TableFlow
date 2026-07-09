export interface SearchAuditEntriesQuery {
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
