# Security Foundation

## Architecture

The Security Foundation module provides a reusable, provider-agnostic security layer aligned with OWASP ASVS and OWASP Top 10 principles.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Security Foundation Module                            │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                     SecurityContextBuilder                        │        │
│  │  Builds enriched security context from auth + request data        │        │
│  └──────────────────────────┬───────────────────────────────────────┘        │
│                             │                                                │
│  ┌──────────────────────────┴───────────────────────────────────────┐        │
│  │                      SecurityValidator                           │        │
│  │  Runs multiple SecurityPolicy instances with error isolation     │        │
│  └──────────────────────────┬───────────────────────────────────────┘        │
│                             │                                                │
│  ┌──────────────────────────┴───────────────────────────────────────┐        │
│  │                     Security Policies                            │        │
│  │                                                                  │        │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐     │        │
│  │  │ Input        │ │ Sensitive    │ │ ResourceOwnership     │     │        │
│  │  │ Validation   │ │ Data         │ │ Policy               │     │        │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘     │        │
│  │  ┌──────────────┐ ┌──────────────┐                              │        │
│  │  │ Operation    │ │ Suspicious   │                              │        │
│  │  │ Authorization│ │ Activity     │                              │        │
│  │  └──────────────┘ └──────────────┘                              │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                               │
│  ┌──────────────────────────┐  ┌───────────────────────────────┐            │
│  │ RequestSecurityAnalyzer  │  │ SecurityHeadersProvider       │            │
│  │ - SQL injection detection│  │ - CSP                        │            │
│  │ - XSS detection          │  │ - X-Content-Type-Options     │            │
│  │ - Path traversal         │  │ - HSTS                       │            │
│  │ - Invalid methods        │  │ - Referrer-Policy            │            │
│  │ - Oversized payloads     │  │ - Permissions-Policy         │            │
│  │ - Internal IPs           │  │ - Cross-Origin policies      │            │
│  └──────────────────────────┘  └───────────────────────────────┘            │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                    SecurityAuditAdapter                          │        │
│  │  Bridges security events → existing Audit module                 │        │
│  └──────────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Module Location

```
src/modules/platform/security/
├── index.ts
├── types.ts
├── SecurityContext.ts           # Builder + factory
├── SecurityPolicy.ts           # 5 policy implementations
├── SecurityValidator.ts        # Policy runner
├── RequestSecurityAnalyzer.ts  # Request threat detection
├── SecurityHeadersProvider.ts  # Configurable headers
├── SecurityAuditAdapter.ts     # Audit integration
└── tests/
    ├── security-context.spec.ts    # 8 tests
    ├── security-policy.spec.ts     # 28 tests
    ├── request-analyzer.spec.ts    # 13 tests
    └── security-headers.spec.ts    # 13 tests
```

## SecurityContext

Enriched security context carrying authenticated user, authorization, and request metadata:

| Field | Source | Description |
|-------|--------|-------------|
| `userId` | Auth/JWT | Authenticated user identifier |
| `organizationId` | Auth/JWT | Organization/tenant ID |
| `roles` | Authorization | Array of `{ roleId, roleCode, roleName, restaurantId }` |
| `permissions` | Authorization | Flat permission string array |
| `restaurantId` | Request/Context | Current restaurant context |
| `tenantId` | Request/Context | Multi-tenant identifier (prepared) |
| `sessionId` | Request | Session tracking ID |
| `requestId` | Request | Correlation with request tracing |
| `correlationId` | Request | Cross-service correlation |
| `ipAddress` | Request | Client IP address |
| `userAgent` | Request | Client user agent |
| `metadata` | Custom | Extensible key-value store |

### Builder Pattern

```typescript
const context = new SecurityContextBuilder()
  .withUserId("user-1")
  .withOrganizationId("org-1")
  .withRoles([{ roleId: "r1", roleCode: "manager", roleName: "Manager", restaurantId: "rest-1" }])
  .withPermissions(["reservation:read", "reservation:write"])
  .withRestaurantId("rest-1")
  .withSessionId("sess-abc")
  .withIpAddress("203.0.113.1")
  .withMetadata("source", "api")
  .build();
```

### Quick Factory

```typescript
const context = createSecurityContext({
  userId: "user-1",
  organizationId: "org-1",
  roles: [/* ... */],
  permissions: ["reservation:read"],
  restaurantId: "rest-1",
});
```

## Security Policies

| Policy | OWASP Category | What It Checks |
|--------|---------------|----------------|
| `InputValidationPolicy` | A1 (Injection) | Null/empty/object data validity |
| `SensitiveDataPolicy` | A3 (Sensitive Exposure) | Field names matching password/secret/token/credential patterns |
| `ResourceOwnershipPolicy` | A1 (Broken Access Control) | Resource owner matches user, restaurant context matches |
| `OperationAuthorizationPolicy` | A1 (Broken Access Control) | User permissions include required permission |
| `SuspiciousActivityPolicy` | A1 (Injection) | SQL injection, XSS, path traversal, template injection patterns |

### Policy Execution

```typescript
const validator = new SecurityValidator();
const context = createSecurityContext({ /* ... */ });

const result = await validator.validate(context, requestData, [
  new InputValidationPolicy(),
  new SensitiveDataPolicy(),
  new ResourceOwnershipPolicy(),
  new OperationAuthorizationPolicy(),
  new SuspiciousActivityPolicy(),
]);

if (!result.passed) {
  // result.failedPolicies contains all violations
  for (const violation of result.failedPolicies) {
    console.error(`[${violation.severity}] ${violation.policyName}: ${violation.message}`);
  }
}
```

### Custom Policy

```typescript
class CustomPolicy extends BaseSecurityPolicy {
  readonly type: SecurityPolicyType = "input_validation";
  readonly name = "Custom Rule";
  readonly enabled = true;

  async evaluate(context: SecurityContext, data: unknown): Promise<SecurityPolicyResult> {
    // Custom logic
    return this.passed("low", "Custom validation passed");
    // or: return this.failed("high", "Custom validation failed");
  }
}
```

## RequestSecurityAnalyzer

Detects security threats in incoming requests:

| Threat Type | Severity | Detection |
|-------------|----------|-----------|
| `unexpected_method` | high | Non-standard or dangerous HTTP methods (TRACE, CONNECT) |
| `invalid_content_type` | high | Content-Type not in allowlist |
| `oversized_payload` | medium | Content-Length exceeds configurable max |
| `missing_header` | low | Missing Host, User-Agent, or Content-Type headers |
| `sql_injection_attempt` | critical | SQL keywords, quote patterns, comment sequences |
| `xss_attempt` | critical | Script tags, event handlers, javascript: URIs |
| `path_traversal_attempt` | high | ../, ..\\, %00 null bytes |
| `suspicious_pattern` | low | Internal/private IP addresses |

### Usage

```typescript
const analyzer = new RequestSecurityAnalyzer(10 * 1024 * 1024); // 10MB max

const result = await analyzer.analyze({
  method: "POST",
  path: "/api/reservations",
  headers: { "host": "example.com", "content-type": "application/json" },
  contentType: "application/json",
  contentLength: 512,
  body: { partySize: 4 },
  query: { date: "2026-07-14" },
  ip: "203.0.113.1",
});

if (!result.passed) {
  // Handle threats
  for (const threat of result.threats) {
    securityAuditAdapter.recordSecurityEvent({
      eventType: "suspicious_request_detected",
      context,
      severity: threat.severity,
      message: threat.message,
      details: threat.details,
      timestamp: new Date(),
    });
  }
}
```

## SecurityHeadersProvider

Configurable security response headers:

| Header | Default Value |
|--------|---------------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; ...` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Embedder-Policy` | `require-corp` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-DNS-Prefetch-Control` | `off` |
| `X-Download-Options` | `noopen` |
| `X-Permitted-Cross-Domain-Policies` | `none` |

### Customization

```typescript
// Constructor defaults
const provider = new SecurityHeadersProvider({
  contentSecurityPolicy: "default-src 'self' *.trusted-cdn.com",
  strictTransportSecurity: null, // Disable HSTS in dev
});

// Runtime override
const headers = provider.getHeaders({
  contentSecurityPolicy: "default-src 'none'", // Strict for specific endpoint
});

// Per-header lookup
const csp = provider.getHeader("Content-Security-Policy");
```

## SecurityAuditAdapter

Bridges security events to the existing Audit module:

| Security Event | Audit Action |
|----------------|-------------|
| `security_policy_violation` | `security_alert` |
| `suspicious_request_detected` | `security_alert` |
| `authentication_failure` | `login_failed` |
| `authorization_failure` | `authorization_failed` |
| `ownership_violation` | `ownership_violation` |
| `sensitive_data_exposure` | `data_exposure` |
| `security_header_missing` | `configuration_issue` |

### Usage

```typescript
const auditAdapter = new SecurityAuditAdapter(auditService);

await auditAdapter.recordSecurityEvent({
  eventType: "security_policy_violation",
  context,
  severity: "high",
  message: "Resource ownership violation detected",
  details: { resourceType: "reservation", resourceId: "res-123" },
  timestamp: new Date(),
});
```

## Dependencies

The Security module reuses:
- **IAM/Auth** — `JwtPayload` for userId, organizationId, role
- **Authorization** — `AuthorizationContext` for roles, permissions, scope, requestMetadata
- **Audit** — `AuditEntry` for security event persistence via `SecurityAuditAdapter`
- **Observability** — `Logger` types for integration
- **Event Bus** — For publishing security events to other modules

## Future Extensions

| Feature | Status |
|---------|--------|
| Rate limiting | Not implemented (separate phase) |
| OAuth 2.0 / OIDC providers | Not implemented (separate phase) |
| API key management | Prepared via interfaces |
| IP allowlist/blocklist | Prepared via RequestSecurityAnalyzer |
| Payload schema validation | Prepared via InputValidationPolicy |
| Encryption/decryption utilities | Future |
| Secrets management | Future |
| WAF integration | Future (Cloudflare, AWS WAF, etc.) |

## Quality Attributes

- **OWASP ASVS-aligned**: Input validation, sensitive data protection, access control, and suspicious activity detection
- **OWASP Top 10**: Covers A1 (Injection), A3 (Sensitive Exposure), A5 (Broken Access Control)
- **Zero Trust principles**: Verify every request, enforce least privilege, never trust implicit ownership
- **SOLID**: Single responsibility per policy, open for extension via `BaseSecurityPolicy`
- **Strategy Pattern**: Each policy is a strategy, composed by `SecurityValidator`
- **No hardcoded values**: SecurityHeadersProvider values are fully configurable
- **Strict TypeScript**: No `any` types, full type safety
- **No business coupling**: Module provides the framework, not business-specific rules
