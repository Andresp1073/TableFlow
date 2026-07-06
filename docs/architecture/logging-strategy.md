# Logging Strategy

**Last updated:** 2026-07-04

## Logging Principles

- **Structered JSON logging.** All logs emit JSON for queryability in centralized log systems.
- **Never log sensitive data.** No passwords, tokens, PII (names, emails, phone numbers in error logs).
- **Correlation IDs.** Every request has a unique ID that flows through all services and logs.
- **Context is everything.** Every log entry includes request ID, user ID, action, and resource.
- **Log levels matter.** Use the correct level for the correct event.

---

## Log Levels

| Level | When | Examples |
|-------|------|----------|
| `error` | System failures, unexpected errors | Unhandled errors, database connection failure |
| `warn` | Handled issues, degraded functionality | Rate limit exceeded, retryable failure, account lockout |
| `info` | Key business events | Reservation created, user logged in, report generated |
| `debug` | Development and troubleshooting | SQL queries, function entry/exit, variable values |
| `trace` | Deep debugging (rarely used) | HTTP headers, raw data dumps |

**Production logging level:** `info` (errors and warnings are always logged regardless of level).

---

## Log Categories

### 1. Application Logs

Standard application behavior and operational events.

| Event | Level | Data |
|-------|-------|------|
| Server started | info | Port, environment, version |
| HTTP request received | info | Method, path, status, duration, requestId |
| Database query | debug | Query, params, duration |
| Configuration loaded | info | Environment, validated fields (not values) |
| Shutdown signal | warn | Signal type |

**Format:**
```json
{ "level": "info", "time": "2025-01-15T19:00:00.000Z", "msg": "HTTP request", "method": "POST", "path": "/api/v1/reservations", "status": 201, "duration": 45, "requestId": "req_abc123", "userId": "usr_456" }
```

### 2. Audit Logs

Immutable records of business-critical actions for compliance and traceability.

| Event | Data Logged |
|-------|-------------|
| Reservation created | userId, customerId, date, time, partySize, tableId, branchId |
| Reservation modified | userId, reservationId, changed fields (before/after) |
| Reservation canceled | userId, reservationId, reason, timestamp |
| Customer merged | userId, sourceCustomerId, targetCustomerId |
| User role changed | adminId, targetUserId, oldRole, newRole |
| User created/deactivated | adminId, targetUserId, action |
| Restaurant settings changed | userId, changes (before/after) |

**Audit log format:**
```json
{ "type": "audit", "time": "...", "actor": "usr_456", "action": "reservation.cancel", "resource": "reservation", "resourceId": "res_789", "details": { "reason": "Customer request", "oldStatus": "CONFIRMED", "newStatus": "CANCELLED" }, "requestId": "req_abc123" }
```

**Audit log rules:**
- Append-only (no deletes, no updates).
- Retained for 12 months (minimum).
- Stored in the database (audit_logs table) for queryability.
- Configurable retention via settings.

### 3. Security Logs

Authentication and authorization events for security monitoring.

| Event | Level | Data |
|-------|-------|------|
| Successful login | info | userId, IP, user agent, timestamp |
| Failed login | warn | email (attempted), IP, user agent, reason |
| Account locked | warn | userId, IP, timestamp |
| Password changed | info | userId, timestamp |
| Token refresh | debug | userId, tokenId |
| Forbidden access attempt | warn | userId, path, required permission |
| Rate limit hit | warn | IP, endpoint, count |

### 4. Error Logs

Every error captured with full context.

**Format:**
```json
{ "level": "error", "time": "...", "msg": "Business rule violation", "err": { "name": "BusinessRuleError", "message": "Cannot cancel a completed reservation", "stack": "..." }, "requestId": "req_abc123", "userId": "usr_456", "action": "cancelReservation", "resourceId": "res_789" }
```

---

## Logger Implementation

```typescript
// Logger configuration (config/logger.ts)
import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, requestId: req.id }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    censor: '[REDACTED]',
  },
});
```

---

## Correlation ID

Every HTTP request receives a unique correlation ID:

```typescript
// Middleware: assigns request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});
```

This ID is:
- Passed to all downstream services (if any).
- Included in every log line for that request.
- Returned in the response header (for debugging support).
- Included in error responses (for user support).

---

## Log Storage and Retention

| Log Type | Storage | Retention | Queryable |
|----------|---------|-----------|-----------|
| Application logs | stdout (Docker) → centralized logging | 30 days | Yes |
| Audit logs | Database (`audit_logs` table) | 12 months | Yes (SQL) |
| Error logs | stdout + Sentry (future) | 90 days (Sentry) | Yes |
| Security logs | stdout + database | 12 months | Yes |

**Centralized logging options:** Datadog, Grafana Loki, ELK Stack, or CloudWatch.

---

## Logging Best Practices

| Rule | Rationale |
|------|-----------|
| Log at the boundary | Log at service entry/exit points, not inside every function |
| Include correlation ID | Allows tracing a request across all logs |
| Never log in a loop | Use batch logging for repetitive operations |
| Structured data only | No string concatenation; use JSON fields |
| No sensitive data | Emails, names, passwords, tokens must be redacted |
| Error logs include stack | Always log the full error object, not just the message |

---

## Future Monitoring Integration

When monitoring is implemented:

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking and performance monitoring |
| Datadog / Grafana | Metrics, dashboards, alerting |
| Pino transports | Send logs to log aggregation service |
| Health check endpoints | `/api/v1/health` — used by load balancers and monitoring |

---

## Related Documents

- [error-handling.md](./error-handling.md) — Error handling and logging
- [security-architecture.md](./security-architecture.md) — Security event logging
- [scalability.md](./scalability.md) — Logging at scale
