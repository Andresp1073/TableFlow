import type { SecurityAuditAdapter as SecurityAuditAdapterInterface, SecurityAuditEvent, SecurityContext } from "./types.js";

export interface AuditServicePort {
  recordSecurityEvent(params: {
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
    metadata: Record<string, unknown> | null;
  }): Promise<void>;
}

export class SecurityAuditAdapter implements SecurityAuditAdapterInterface {
  constructor(private readonly auditService: AuditServicePort) {}

  async recordSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    await this.auditService.recordSecurityEvent({
      organizationId: event.context.organizationId,
      module: "security",
      entityType: "security_event",
      entityId: event.eventType,
      action: this.mapEventTypeToAction(event.eventType),
      performedBy: event.context.userId || null,
      restaurantId: event.context.restaurantId ?? null,
      ipAddress: event.context.ipAddress ?? null,
      userAgent: event.context.userAgent ?? null,
      requestId: event.context.requestId ?? null,
      metadata: {
        severity: event.severity,
        message: event.message,
        details: event.details,
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        correlationId: event.context.correlationId,
        sessionId: event.context.sessionId,
      },
    });
  }

  private mapEventTypeToAction(eventType: string): string {
    switch (eventType) {
      case "security_policy_violation":
      case "suspicious_request_detected":
      case "suspicious_activity":
        return "security_alert";
      case "authentication_failure":
        return "login_failed";
      case "authorization_failure":
        return "authorization_failed";
      case "ownership_violation":
        return "ownership_violation";
      case "sensitive_data_exposure":
        return "data_exposure";
      case "security_header_missing":
        return "configuration_issue";
      default:
        return "security_event";
    }
  }
}
