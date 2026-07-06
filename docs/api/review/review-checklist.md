# Review Checklist

**Last updated:** 2026-07-04

## 1. API Design Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | All endpoints use plural nouns | ✅ | Users, Branches, Reservations, etc. |
| 1.2 | Consistent HTTP method usage | ✅ | GET=read, POST=create, PATCH=update, DELETE=delete |
| 1.3 | Idempotent methods are safe | ✅ | GET, PUT, DELETE are idempotent |
| 1.4 | Non-idempotent methods support Idempotency-Key | ✅ | POST and PATCH |
| 1.5 | URL versioning used | ✅ | `/api/v1/` |
| 1.6 | Consistent error response format | ❌ | OpenAPI uses `AUTH_001`, error-catalog uses `auth.token.missing` |
| 1.7 | All endpoints have documented permissions | ✅ | Every endpoint has a permission |
| 1.8 | Rate limits defined | ✅ | 6 tiers defined |
| 1.9 | Pagination on all list endpoints | ✅ | Offset or cursor |
| 1.10 | Filtering on all list endpoints | ✅ | Operator-prefix convention |
| 1.11 | Sorting on all list endpoints | ✅ | sortBy + sortDirection |
| 1.12 | Validation rules documented | ✅ | Per-field in endpoint catalog |
| 1.13 | Request/response examples provided | ✅ | Key endpoints have examples |

## 2. OpenAPI Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | All endpoints from catalog present | ❌ | Missing webhooks, organizations, audit-logs |
| 2.2 | All request schemas match catalog | ✅ | Field-level match verified |
| 2.3 | All response schemas match catalog | ⚠️ | `message` field extra, missing `updatedBy` |
| 2.4 | Error responses defined | ✅ | Unauthorized, Forbidden, NotFound, Validation, Conflict, InternalError |
| 2.5 | Security scheme defined | ✅ | BearerAuth (JWT) |
| 2.6 | Security applied to all protected paths | ✅ | All non-auth endpoints require BearerAuth |
| 2.7 | Pagination parameters defined | ✅ | page, pageSize, cursor, limit |
| 2.8 | Filter parameters defined | ✅ | On query params for each list endpoint |
| 2.9 | Webhooks defined | ✅ | 3 placeholder webhooks |
| 2.10 | Tags organized | ✅ | 18 tags matching modules |
| 2.11 | examples provided on key endpoints | ✅ | Auth, reservations, branches |
| 2.12 | Valid OpenAPI 3.1 structure | ✅ | Passes structural validation |

## 3. Database Alignment Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | All DB entities have API representations | ✅ | 21 tables mapped |
| 3.2 | DB column types match API field types | ✅ | UUID→string, INT→integer, DATE→date, etc. |
| 3.3 | DB nullable matches API nullable | ✅ | Confirmed for all fields |
| 3.4 | DB unique constraints reflected in API | ⚠️ | Duplicate handling via 409 Conflict |
| 3.5 | All API fields exist in DB | ❌ | `updated_by` and `no_show_marked_at` missing from API |
| 3.6 | DB field names cased correctly in API | ✅ | snake_case→camelCase |
| 3.7 | No unexpected API fields without DB backing | ✅ | All API fields map to DB |

## 4. Security Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | All protected endpoints require auth | ✅ | Verified |
| 4.2 | Public endpoints are correctly open | ✅ | Auth endpoints (login, register, etc.) |
| 4.3 | Permissions match authorization design | ⚠️ | Matrix has 20+ permissions not in catalog |
| 4.4 | No sensitive data exposed | ⚠️ | PII exposed in plaintext (encryption plan exists) |
| 4.5 | Password hashes never exposed | ✅ | Not in any response |
| 4.6 | Token expiry documented | ✅ | 15 min access, 7 day refresh |
| 4.7 | Rate limiting on auth endpoints | ✅ | 10/min |
| 4.8 | Idempotency supported for critical operations | ✅ | POST and PATCH |

## 5. Naming Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | Consistent resource naming | ⚠️ | "Organizations" vs "Restaurants" |
| 5.2 | Consistent field naming | ✅ | All camelCase |
| 5.3 | Consistent enum values | ✅ | All SCREAMING_SNAKE_CASE |
| 5.4 | Consistent error codes | ❌ | Three different formats |
| 5.5 | DTO naming consistent | ✅ | PascalCase |
| 5.6 | URL path naming consistent | ✅ | Plural nouns, kebab-case for multi-word |
| 5.7 | Permission naming consistent | ⚠️ | `roles.assign_permissions` vs `roles.assign` |

## 6. Architecture Alignment Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | All modules have API endpoints | ✅ | 14→14 mapping |
| 6.2 | No orphan endpoints | ✅ | All endpoints belong to a module |
| 6.3 | No cross-module violations | ✅ | Dependencies follow Clean Architecture |
| 6.4 | Clean Architecture layers respected | ✅ | Not violated in design |
| 6.5 | Module boundaries clear | ✅ | Distinct base paths per module |

## Summary

| Section | Pass | Fail | Partial |
|---------|------|------|---------|
| API Design | 11 | 1 | 1 |
| OpenAPI | 9 | 1 | 2 |
| Database Alignment | 5 | 1 | 1 |
| Security | 5 | 0 | 2 |
| Naming | 4 | 1 | 2 |
| Architecture | 5 | 0 | 0 |
| **Total** | **39** | **4** | **8** |

## Cross-References

- [api-consistency-report.md](./api-consistency-report.md) — Full consistency report
- [final-recommendations.md](./final-recommendations.md) — Action plan
