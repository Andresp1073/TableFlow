# Missing Endpoints

**Last updated:** 2026-07-04

## Endpoints Missing from OpenAPI (vs endpoint-catalog.md + webhooks.md)

| # | Method | Path | Defined In | Missing From | Severity |
|---|--------|------|------------|-------------|----------|
| 1 | GET | `/api/v1/organizations` | endpoint-catalog.md | openapi.yaml | 🔴 CRITICAL |
| 2 | GET | `/api/v1/webhooks/{id}` | webhooks.md | openapi.yaml | 🔴 CRITICAL |
| 3 | GET | `/api/v1/webhooks/{id}/deliveries` | webhooks.md | openapi.yaml | 🔴 CRITICAL |
| 4 | POST | `/api/v1/webhooks/{id}/test` | webhooks.md | openapi.yaml | 🔴 CRITICAL |

## Endpoints Missing from endpoint-catalog.md

| # | Method | Path | Defined In | Missing From | Severity |
|---|--------|------|------------|-------------|----------|
| 5 | GET | `/api/v1/audit-logs` | openapi.yaml, api-overview.md | endpoint-catalog.md | 🟡 MEDIUM |
| 6 | GET | `/api/v1/search` | openapi.yaml, search.md | endpoint-catalog.md | 🟡 MEDIUM |

## Endpoints Missing from All Sources

| # | Method | Path | Severity | Notes |
|---|--------|------|----------|-------|
| 7 | GET | `/api/v1/roles/{id}` | 🔵 LOW | Only list/get-all defined; no single-role detail endpoint |
| 8 | GET | `/api/v1/settings/{id}` | 🔵 LOW | Only list and update defined |

## Analysis

### Impact

| Issue | Impact |
|-------|--------|
| Missing `GET /organizations` | Super admin cannot list organizations via public API |
| Missing webhook endpoints | Cannot view single webhook detail, delivery history, or send test events |
| Missing audit-logs from catalog | Endpoint exists in code but not documented for developers |
| Missing search from catalog | Search API exists but not discoverable |
| Missing single-role GET | Cannot fetch a single role's details without listing all |

### Recommendations

| Item | Fix |
|------|-----|
| 1-4 | Add to openapi.yaml before backend implementation |
| 5-6 | Add audit-logs and search sections to endpoint-catalog.md |
| 7 | Add `GET /api/v1/roles/{id}` to both catalog and OpenAPI |
| 8 | Add `GET /api/v1/settings/{id}` to both catalog and OpenAPI (optional) |

## Cross-References

- [openapi-validation.md](./openapi-validation.md) — Broader OpenAPI gaps
- [endpoint-catalog.md](../endpoint-catalog.md) — Current endpoint inventory
