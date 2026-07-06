# Security Architecture

**Last updated:** 2026-07-04

## Defense in Depth

```
Layer 1: Network Security      → TLS 1.3, CORS, firewall
Layer 2: Authentication        → JWT, refresh tokens, MFA (future)
Layer 3: Authorization         → RBAC, scope enforcement
Layer 4: Input Validation      → Zod, sanitization, rate limiting
Layer 5: Data Protection       → Encryption at rest, PII protection
Layer 6: Audit & Monitoring    → Immutable logs, alerting
```

---

## Authentication

### Registration Flow

```
User submits email + password
    │
    ▼
Validate: email format, password complexity (Zod)
    │
    ▼
Hash password (bcrypt, cost 12)
    │
    ▼
Create user record (status: UNVERIFIED)
    │
    ▼
Send verification email (with token)
    │
    ▼
User clicks verification link → status: ACTIVE
```

### Login Flow

```
User submits email + password
    │
    ▼
Rate limit check (10 attempts/minute per IP)
    │
    ▼
Find user by email
    ├─ Not found → 401 (generic "Invalid credentials")
    │
    ▼
Verify password (bcrypt.compare)
    ├─ Failed → increment failed_attempts
    │          if failed_attempts >= 5 → LOCK account (30 minutes)
    │          → 401
    │
    ▼
Generate access token (JWT, 15 min expiry)
Generate refresh token (JWT, 7 day expiry, rotated on use)
    │
    ▼
Return: { accessToken, refreshToken (HTTP-only cookie) }
```

### Token Refresh Flow

```
Client sends refresh token (cookie)
    │
    ▼
Validate refresh token (signature, expiry, not revoked)
    │
    ▼
Issue new access token (15 min)
Issue new refresh token (rotation — old one invalidated)
    │
    ▼
Return new tokens
```

---

## JWT Structure

### Access Token

```json
{
  "sub": "user-uuid",
  "role": "restaurant_admin",
  "scope": "organization:org-uuid",
  "permissions": ["reservations.create", "reservations.read", "tables.assign"],
  "iat": 1704067200,
  "exp": 1704068100,
  "jti": "unique-token-id",
  "iss": "tableflow"
}
```

### Refresh Token

```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "iat": 1704067200,
  "exp": 1704672000,
  "jti": "unique-token-id",
  "iss": "tableflow"
}
```

---

## Authorization (RBAC)

See [docs/authorization-model.md](../docs/authorization-model.md) and [docs/permission-matrix.md](../docs/permission-matrix.md) for complete details.

**Architecture:**
- Each endpoint is annotated with required permission: `@RequirePermission('reservations.create')`.
- Middleware extracts user role from JWT.
- Middleware looks up role-permissions mapping (cached).
- Middleware verifies permission is present.
- Scope middleware verifies user has access to the target resource (branch/organization).

---

## Password Storage

| Parameter | Value |
|-----------|-------|
| Algorithm | bcrypt |
| Salt rounds | 12 |
| Minimum password length | 12 characters |
| Character requirements | Uppercase, lowercase, digit, special character |
| Password history | 5 most recent passwords (prevent reuse) |
| Maximum age | 90 days |

---

## Security Headers

Every HTTP response includes:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Implemented via `helmet` middleware:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## CORS

| Setting | Development | Production |
|---------|-------------|------------|
| `origin` | `http://localhost:5173` | `https://app.tableflow.com` |
| `methods` | `GET, POST, PUT, PATCH, DELETE, OPTIONS` | Same |
| `allowedHeaders` | `Content-Type, Authorization, X-CSRF-Token` | Same |
| `credentials` | `true` | `true` |
| `maxAge` | `86400` | `86400` |

---

## Rate Limiting

| Endpoint | Limit | Window | Applied By |
|----------|-------|--------|------------|
| Auth (login, register, reset) | 10 | 1 minute | Global rate limiter |
| General API | 200 | 1 minute | Global rate limiter |
| Report export | 10 | 1 hour | Module-specific rate limiter |
| Availability search | 60 | 1 minute | Module-specific rate limiter |

**Implementation:**
```typescript
// Global rate limiter
app.use(rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
}));
```

---

## Input Validation

| Layer | Method | Scope |
|-------|--------|-------|
| Network | WAF (future) | Malformed requests, DDoS |
| Transport | Helmet + CORS | Headers, origin |
| Application | Zod schemas | Request body, params, query |
| Database | Prisma parameterized queries | SQL injection prevention |
| Output | JSON serialization | No HTML injection in API responses |

---

## Input Sanitization

| Attack Vector | Mitigation |
|---------------|------------|
| SQL injection | Prisma parameterized queries (never raw string interpolation) |
| XSS | React's built-in escaping, Content-Security-Policy header |
| NoSQL injection | Not applicable (MySQL) |
| Command injection | Never exec user input in shell commands |
| Path traversal | Validate file paths, restrict to upload directory |
| SSRF | Whitelist allowed external URLs for integrations |

---

## Audit Logging

Every security-relevant event is logged immutably:

| Event | Details |
|-------|---------|
| Successful login | user, IP, userAgent, timestamp |
| Failed login | attemptedEmail, IP, userAgent, timestamp |
| Password change | user, timestamp |
| Account lockout | user, IP, timestamp |
| Role/permission change | admin, targetUser, oldRole, newRole, timestamp |
| User account create/delete | admin, targetUser, action, timestamp |
| Forbidden access | user, path, requiredPermission, timestamp |
| API token creation | user, tokenName, scopes, timestamp |

---

## Secrets Management

| Secret | Storage | Access |
|--------|---------|--------|
| JWT signing key | Environment variable (`JWT_SECRET`) | Only at startup |
| Database password | Environment variable (`DATABASE_URL`) | Prisma client init |
| SMTP credentials | Environment variables | Email service init |
| Encryption keys | Environment variables (future: KMS) | Application startup |

**Rules:**
- Never log secrets.
- Never commit `.env` files.
- Rotate secrets on a schedule.
- Use a secrets manager in production (AWS Secrets Manager, Vault).

---

## Future Security Enhancements

| Feature | Priority | Phase |
|---------|----------|-------|
| MFA (TOTP) | Medium | Phase 6 |
| API keys for integrations | Medium | Phase 6 |
| WAF (Web Application Firewall) | Low | Phase 8 |
| Penetration testing | High | Before launch |
| Security headers monitoring | Low | Phase 8 |
| Rate limiting per user (vs IP) | Medium | Phase 5 |
| Audit log anomaly detection | Low | Phase 7 |

---

## Related Documents

- [security-guidelines.md](../.ai/security-guidelines.md) — Security policies
- [docs/authorization-model.md](../docs/authorization-model.md) — RBAC details
- [docs/permissions.md](../docs/permissions.md) — Permission catalog
- [logging-strategy.md](./logging-strategy.md) — Audit logging
