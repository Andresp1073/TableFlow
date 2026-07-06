# API Overview

**Last updated:** 2026-07-04

## Design Philosophy

TableFlow follows an **API First** approach. The API contract is designed and documented before any backend code is written. This ensures:

| Principle | Application |
|-----------|-------------|
| **Consistency** | Every endpoint follows the same patterns for pagination, filtering, sorting, errors, and responses |
| **Developer Experience** | Predictable URL structure, unified error format, comprehensive documentation |
| **Scalability** | Stateless authentication, cursor-based pagination for high-volume endpoints, idempotency support |
| **Security** | JWT authentication, RBAC enforcement, rate limiting, input validation at API gateway |
| **Backward Compatibility** | URL versioning (`/api/v1/`), additive-only field changes, deprecation headers |

## Base URL

| Environment | Base URL |
|-------------|----------|
| **Development** | `http://localhost:4000/api/v1` |
| **Staging** | `https://staging-api.tableflow.com/api/v1` |
| **Production** | `https://api.tableflow.com/api/v1` |

## API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Authentication | `/api/v1/auth` | Login, register, refresh, logout, password management |
| Users | `/api/v1/users` | Staff user management |
| Roles | `/api/v1/roles` | Role definitions and permission assignments |
| Permissions | `/api/v1/permissions` | Permission catalog (read-only) |
| Restaurants | `/api/v1/organizations` | Tenant/restaurant company management |
| Branches | `/api/v1/branches` | Physical restaurant location management |
| Tables | `/api/v1/tables` | Physical table management |
| Reservations | `/api/v1/reservations` | Central booking operations |
| Customers | `/api/v1/customers` | Diner profile management |
| Employees | `/api/v1/employees` | Staff employment records |
| Reports | `/api/v1/reports` | Aggregated data and analytics |
| Notifications | `/api/v1/notifications` | Notification history and management |
| Dashboard | `/api/v1/dashboard` | Role-specific dashboard aggregates |
| Settings | `/api/v1/settings` | Branch and organization configuration |
| Audit Logs | `/api/v1/audit-logs` | Immutable system event log |
| Webhooks | `/api/v1/webhooks` | Outbound webhook configuration |

## Protocol

| Attribute | Value |
|-----------|-------|
| **Protocol** | HTTPS only |
| **TLS version** | 1.3 minimum |
| **HTTP version** | HTTP/2 preferred |
| **Content type** | `application/json` |
| **Accept header** | `application/json` |

## Cross-References

- [api-standards.md](./api-standards.md) — Naming conventions, URL structure, HTTP verbs
- [authentication.md](./authentication.md) — Auth endpoints and token management
- [authorization.md](./authorization.md) — RBAC integration
- [endpoint-catalog.md](./endpoint-catalog.md) — Complete endpoint reference
- [request-response-standards.md](./request-response-standards.md) — Unified response format
- [error-catalog.md](./error-catalog.md) — Error codes and recovery
- [pagination.md](./pagination.md) — Pagination design
- [filtering.md](./filtering.md) — Query parameter filtering
- [sorting.md](./sorting.md) — Sort specification
- [search.md](./search.md) — Search patterns
- [validation.md](./validation.md) — Validation rules
- [versioning.md](./versioning.md) — Versioning strategy
- [rate-limit.md](./rate-limit.md) — Rate limiting
- [idempotency.md](./idempotency.md) — Idempotency support
- [webhooks.md](./webhooks.md) — Webhook events
- [future-api.md](./future-api.md) — Future considerations
- [swagger-plan.md](./swagger-plan.md) — OpenAPI documentation plan
