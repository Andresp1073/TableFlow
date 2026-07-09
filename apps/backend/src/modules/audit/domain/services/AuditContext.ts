export interface RequestAuditContext {
  performedBy: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  organizationId: string | null;
}

export interface AuditContextExtractor {
  extract(req: unknown): RequestAuditContext;
}
