# Naming Inconsistencies

**Last updated:** 2026-07-04

## Cross-Source Naming Conflicts

### 1. Module Name: "Restaurants" vs "Organizations"

| Source | Name Used |
|--------|-----------|
| module-architecture.md | Restaurants |
| modules.md | Restaurants |
| api-overview.md | Restaurants |
| endpoint-catalog.md | Restaurants (section: Organizations) |
| openapi.yaml | Restaurants (tag) |
| database table | `organizations` |

**Verdict:** 🟡 MEDIUM — The module is called "Restaurants" in architecture docs but the database table is `organizations` and the API path is `/api/v1/organizations`. Developers will be confused about whether to use "Restaurant" or "Organization" in conversation and code.

**Recommendation:** Standardize on **Organizations** (since the DB table is already named that way, and the API path uses it).

### 2. Error Code Format

| Source | Format | Example |
|--------|--------|---------|
| openapi.yaml | `{PREFIX}_{NUMBER}` | `AUTH_001`, `VAL_001` |
| error-catalog.md | `{module}.{type}.{detail}` | `auth.token.missing`, `validation.failed` |
| request-response-standards.md | `{module}.{type}` | `reservation.overlap` |

**Verdict:** 🔴 CRITICAL — Three different formats across the documentation. Backend implementation cannot proceed without a single standard.

**Recommendation:** Adopt the **dot-notation** format (`auth.token.missing`) as it is more descriptive, hierarchical, and easier for API consumers to parse programmatically. Update OpenAPI examples accordingly.

### 3. Permission Naming

| Source | Name | Alternate Name | Location |
|--------|------|----------------|----------|
| authorization.md | `roles.assign_permissions` | — | permission catalog |
| permission-matrix.md | — | `roles.assign` | permission matrix |

**Verdict:** 🟡 MEDIUM — Same concept, different naming convention.

### 4. API Overview Base Paths

| Source | Listed Path | Actual Path |
|--------|-------------|-------------|
| api-overview.md | `/api/v1/tables` | `/api/v1/branches/{branchId}/tables` |
| api-overview.md | `/api/v1/employees` | `/api/v1/branches/{branchId}/employees` |

**Verdict:** 🟡 MEDIUM — Developers reading the overview will look for tables at the wrong path.

**Recommendation:** Update api-overview.md to show the correct nested paths.

### 5. Response Envelope Field: `message`

| Source | Has `message` Field |
|--------|---------------------|
| request-response-standards.md | ❌ No (only `success`, `data`, `meta`, `error`) |
| openapi.yaml `SuccessResponse` | ✅ Yes (required) |
| endpoint-catalog.md examples | ❌ No (`message` not shown in examples) |

**Verdict:** 🔴 CRITICAL — Implementation will have conflicting requirements.

**Recommendation:** Either add `message` to the standards doc or remove it from OpenAPI.

### 6. Status Values

| Source | Values |
|--------|--------|
| database (table-design.md) | `PENDING, CONFIRMED, SEATED, COMPLETED, NO_SHOW, CANCELLED` |
| openapi.yaml | `PENDING, CONFIRMED, SEATED, COMPLETED, NO_SHOW, CANCELLED` |
| endpoint-catalog.md | `PENDING, CONFIRMED, SEATED, COMPLETED, NO_SHOW, CANCELLED` |

**Verdict:** ✅ Consistent — All sources agree.

### 7. Source Values

| Source | Values |
|--------|--------|
| database (table-design.md) | `PHONE, WALK_IN, ONLINE, STAFF` |
| openapi.yaml | `PHONE, WALK_IN, ONLINE, STAFF` |
| endpoint-catalog.md | `PHONE, WALK_IN, ONLINE, STAFF` |

**Verdict:** ✅ Consistent — All sources agree.

## Summary

| Issue | Severity | Sources Affected |
|-------|----------|-----------------|
| "Restaurants" vs "Organizations" | 🟡 MEDIUM | module-architecture, modules, api-overview vs database |
| Error code format (3 formats) | 🔴 CRITICAL | openapi.yaml, error-catalog.md, request-response-standards.md |
| Permission naming mismatch | 🟡 MEDIUM | authorization.md vs permission-matrix.md |
| Base paths wrong | 🟡 MEDIUM | api-overview.md |
| Response envelope `message` | 🔴 CRITICAL | openapi.yaml vs request-response-standards.md |

## Cross-References

- [openapi-validation.md](./openapi-validation.md) — OpenAPI-specific naming issues
- [security-review.md](./security-review.md) — Permission naming
- [final-recommendations.md](./final-recommendations.md) — Action plan
