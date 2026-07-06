# Security Review

**Last updated:** 2026-07-04

## Authentication Coverage

| Endpoint Group | Auth Required | In OpenAPI | Status |
|----------------|---------------|------------|--------|
| Auth: register, login, refresh, forgot-password, reset-password, verify-email | ❌ No (public) | ✅ | Correct |
| Auth: logout, change-password | ✅ Yes (JWT) | ✅ | Correct |
| All other endpoints | ✅ Yes (JWT) | ✅ | Correct |

**Verdict:** ✅ All public/protected boundaries are correctly defined.

## Permission Coverage

### Permission Catalog vs Endpoint Requirements

| Permission | Defined in authorization.md | Used in endpoint-catalog.md | Status |
|------------|---------------------------|----------------------------|--------|
| `reservations.create` | ✅ | ✅ | ✅ |
| `reservations.read` | ✅ | ✅ | ✅ |
| `reservations.update` | ✅ | ✅ | ✅ |
| `reservations.cancel` | ✅ | ✅ | ✅ |
| `reservations.confirm` | ✅ | ✅ | ✅ |
| `reservations.checkin` | ✅ | ✅ | ✅ |
| `reservations.checkout` | ✅ | ✅ | ✅ |
| `reservations.noshow` | ✅ | ✅ | ✅ |
| `reservations.assign_table` | ✅ | ✅ | ✅ |
| `customers.create` | ✅ | ✅ | ✅ |
| `customers.read` | ✅ | ✅ | ✅ |
| `customers.update` | ✅ | ✅ | ✅ |
| `customers.flag` | ✅ | ✅ | ✅ |
| `customers.merge` | ✅ | ❌ (no merge endpoint) | 🟡 |
| `tables.create` | ✅ | ✅ | ✅ |
| `tables.read` | ✅ | ✅ | ✅ |
| `tables.update` | ✅ | ✅ | ✅ |
| `tables.delete` | ✅ | ✅ | ✅ |
| `tables.assign` | ✅ | ✅ | ✅ |
| `branches.create` | ✅ | ✅ | ✅ |
| `branches.read` | ✅ | ✅ | ✅ |
| `branches.update` | ✅ | ✅ | ✅ |
| `branches.delete` | ✅ | ✅ | ✅ |
| `users.create` | ✅ | ✅ | ✅ |
| `users.read` | ✅ | ✅ | ✅ |
| `users.update` | ✅ | ✅ | ✅ |
| `users.delete` | ✅ | ✅ | ✅ |
| `roles.create` | ✅ | ✅ | ✅ |
| `roles.read` | ✅ | ✅ | ✅ |
| `roles.update` | ✅ | ✅ | ✅ |
| `roles.delete` | ✅ | ✅ | ✅ |
| `roles.assign_permissions` | ✅ | ❌ (no separate endpoint) | 🟡 |
| `reports.view` | ✅ | ✅ | ✅ |
| `reports.export` | ✅ | ✅ | ✅ |
| `settings.read` | ✅ | ✅ | ✅ |
| `settings.update` | ✅ | ✅ | ✅ |
| `audit.read` | ✅ | ✅ | ✅ |

### Permissions in Matrix Not in Catalog

The following permissions exist in the [permission-matrix.md](../../permission-matrix.md) but are **NOT defined** in the [authorization.md](../authorization.md) permission catalog:

| Permission | Notes |
|------------|-------|
| `users.list` | Covered by `users.read` |
| `users.changeRole` | Covered by `users.update` |
| `users.invite` | No invite endpoint defined |
| `users.disable` | Covered by `users.update` |
| `users.enable` | Covered by `users.update` |
| `branches.configureHours` | Covered by `branches.update` |
| `branches.configurePolicies` | Covered by `branches.update` |
| `tables.release` | Covered by `reservations.assign_table` |
| `tables.merge` | No merge endpoint |
| `tables.split` | No split endpoint |
| `tables.disable` | Covered by `tables.update` |
| `tables.configureLayout` | Covered by `tables.update` |
| `customers.merge` | No merge endpoint |
| `reports.viewDashboard` | Covered by implicit dashboard permission |
| `reports.configureMetrics` | No config endpoint |
| `reports.schedule` | No schedule endpoint |
| `notifications.viewLog` | Covered by `settings.read` |
| `notifications.configureTemplates` | No template endpoint |
| `notifications.configurePreferences` | Covered by `settings.update` |

**Verdict:** 🟡 MEDIUM — The permission matrix defines many fine-grained permissions that are not reflected in the authorization catalog or endpoint design. This could cause confusion during RBAC implementation.

### DELETE Permission Mismatch

| Endpoint | Required Permission | Actual Permission Needed |
|----------|-------------------|------------------------|
| `DELETE /api/v1/reservations/{id}` | `reservations.cancel` | Should be `reservations.delete` |
| `DELETE /api/v1/customers/{id}` | `customers.update` | Should be `customers.delete` |

**Verdict:** 🟡 MEDIUM — DELETE endpoints should use dedicated delete permissions, not update or cancel.

## Sensitive Data Exposure

### Fields Never Exposed in API Responses (Correct)

| DB Field | Reason |
|----------|--------|
| `users.password_hash` | Security — never expose password hashes |
| `users.failed_login_attempts` | Security — internal account management |
| `users.locked_until` | Security — internal account management |
| `refresh_tokens.token_hash` | Security — token hash should never be returned |

**Verdict:** ✅ All sensitive data is properly excluded from API responses.

### PII Exposure (Medium Risk)

The API exposes the following PII fields in plaintext:

| Field | Endpoint | Risk |
|-------|----------|------|
| `customers.email` | All customer endpoints | PII — see encryption plan in security-measures.md |
| `customers.phone` | All customer endpoints | PII — see encryption plan |
| `customers.firstName` | All customer endpoints | Personal data |
| `customers.lastName` | All customer endpoints | Personal data |
| `customers.preferences` | All customer endpoints | May contain health data (allergies) |
| `users.email` | User endpoints | PII |
| `notifications.recipientEmail` | Notification endpoints | PII |
| `notifications.recipientPhone` | Notification endpoints | PII |

**Verdict:** 🟡 MEDIUM — These are documented in the security-measures.md PII encryption plan but are exposed as plaintext in the current API design. The encryption plan must be implemented before production launch.

## Rate Limit Discrepancy

| Source | Value |
|--------|-------|
| rate-limit.md | 200 requests/min (general tier) |
| authorization-model.md | 100 requests/min (general API) |

**Verdict:** 🟡 MEDIUM — These values must agree before implementation.

## Recommendations

| Issue | Priority | Fix |
|-------|----------|-----|
| Permission matrix vs catalog drift | MEDIUM | Either reduce matrix to match catalog or expand catalog to match matrix |
| DELETE permissions use wrong action | MEDIUM | Change to dedicated `reservations.delete` and `customers.delete` |
| Rate limit values disagree | MEDIUM | Unify on 200/min (rate-limit.md is more detailed) |
| PII exposure | MEDIUM | Implement encryption plan before production |
| Missing `reservations.delete` in authorization catalog | LOW | Add to catalog |

## Cross-References

- [authorization.md](../authorization.md) — Permission catalog
- [permission-matrix.md](../../permission-matrix.md) — Permission matrix
- [error-catalog.md](../error-catalog.md) — Auth error codes
- [rate-limit.md](../rate-limit.md) — Rate limiting
- [naming-inconsistencies.md](./naming-inconsistencies.md) — Permission naming issues
