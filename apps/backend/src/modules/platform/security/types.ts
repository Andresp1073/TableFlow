export interface SecurityContext {
  userId: string;
  organizationId: string;
  roles: SecurityRole[];
  permissions: string[];
  restaurantId?: string;
  tenantId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

export interface SecurityRole {
  roleId: string;
  roleCode: string;
  roleName: string;
  restaurantId: string | null;
}

export type SecurityPolicyType =
  | "input_validation"
  | "sensitive_data"
  | "resource_ownership"
  | "operation_authorization"
  | "suspicious_activity";

export interface SecurityPolicy {
  readonly type: SecurityPolicyType;
  readonly name: string;
  readonly enabled: boolean;
  evaluate(context: SecurityContext, data: unknown): Promise<SecurityPolicyResult>;
}

export interface SecurityPolicyResult {
  passed: boolean;
  policyName: string;
  policyType: SecurityPolicyType;
  severity: "low" | "medium" | "high" | "critical";
  message?: string;
  details?: Record<string, unknown>;
}

export interface SecurityValidator {
  validate(context: SecurityContext, data: unknown, policies: SecurityPolicy[]): Promise<SecurityValidationResult>;
}

export interface SecurityValidationResult {
  passed: boolean;
  results: SecurityPolicyResult[];
  failedPolicies: SecurityPolicyResult[];
}

export interface RequestAnalysisResult {
  passed: boolean;
  threats: ThreatFinding[];
}

export interface ThreatFinding {
  type: ThreatType;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details?: Record<string, unknown>;
}

export type ThreatType =
  | "malformed_request"
  | "invalid_header"
  | "invalid_content_type"
  | "oversized_payload"
  | "unexpected_method"
  | "suspicious_pattern"
  | "missing_header"
  | "sql_injection_attempt"
  | "xss_attempt"
  | "path_traversal_attempt";

export interface RequestData {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  contentType?: string;
  contentLength?: number;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  ip?: string;
}

export interface RequestSecurityAnalyzer {
  analyze(request: RequestData): Promise<RequestAnalysisResult>;
}

export interface SecurityHeader {
  name: string;
  value: string;
}

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string | null;
  xContentTypeOptions?: string | null;
  xFrameOptions?: string | null;
  referrerPolicy?: string | null;
  permissionsPolicy?: string | null;
  crossOriginOpenerPolicy?: string | null;
  crossOriginEmbedderPolicy?: string | null;
  crossOriginResourcePolicy?: string | null;
  strictTransportSecurity?: string | null;
  xDNSPrefetchControl?: string | null;
  xDownloadOptions?: string | null;
  xPermittedCrossDomainPolicies?: string | null;
}

export interface SecurityHeadersProvider {
  getHeaders(config?: SecurityHeadersConfig): SecurityHeader[];
  getHeader(name: string): SecurityHeader | undefined;
  getDefaultConfig(): SecurityHeadersConfig;
}

export type SecurityAuditEventType =
  | "security_policy_violation"
  | "suspicious_request_detected"
  | "authentication_failure"
  | "authorization_failure"
  | "ownership_violation"
  | "sensitive_data_exposure"
  | "security_header_missing";

export interface SecurityAuditEvent {
  eventType: SecurityAuditEventType;
  context: SecurityContext;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface SecurityAuditAdapter {
  recordSecurityEvent(event: SecurityAuditEvent): Promise<void>;
}
