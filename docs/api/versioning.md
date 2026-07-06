# Versioning

**Last updated:** 2026-07-04

## Strategy: URL Path Versioning

TableFlow uses **URL path versioning** (`/api/v1/`, `/api/v2/`). This is the most explicit and easy-to-discover versioning approach.

## Version Format

```
/api/v{major}/
```

| Component | Description | Example |
|-----------|-------------|---------|
| `v` | Version prefix | `v` |
| `{major}` | Major version number | `1`, `2`, `3` |

## Versioning Policy

| Policy | Detail |
|--------|--------|
| **Major versions** | Breaking changes increment the major version (`v1` → `v2`) |
| **Minor changes** | Additive-only changes (new fields, new endpoints) within same major version |
| **Deprecation notice** | Minimum 6 months notice before a major version is deprecated |
| **Sunset period** | Old version supported for 12 months after new version is released |
| **Maximum versions** | At most 2 major versions active at any time |

## Deprecation Headers

When a request is made to a deprecated version, the API includes:

| Header | Description | Example |
|--------|-------------|---------|
| `Deprecation` | RFC 8594 — timestamp when deprecated | `Sun, 04 Jul 2027 00:00:00 GMT` |
| `Sunset` | RFC 8594 — when version is removed | `Sat, 04 Jul 2028 00:00:00 GMT` |
| `Link` | Link to new version | `<https://api.tableflow.com/api/v2/reservations>; rel="successor-version"` |

## Backward Compatibility Rules

| Change | Compatible? | Example |
|--------|-------------|---------|
| Adding a new field to response | ✅ Yes | `{ "name": "...", "newField": "..." }` |
| Adding a new endpoint | ✅ Yes | `POST /api/v1/new-resource` |
| Adding an optional request field | ✅ Yes | `{ "name": "...", "optionalField": "..." }` |
| Removing a response field | ❌ Breaking | Must be v2 |
| Renaming a field | ❌ Breaking | Must be v2 |
| Changing a field type | ❌ Breaking | Must be v2 |
| Making a required field optional | ✅ Yes | Backward compatible |
| Making an optional field required | ❌ Breaking | Must be v2 |
| Changing endpoint URL | ❌ Breaking | Must be v2 |
| Changing error codes | ❌ Breaking | Must be v2 |

## Internal Version Headers (Optional)

Clients can include an `API-Version` header for fine-grained control, but URL path remains the primary mechanism.

## Version Lifecycle

```
v1 (2026-07) ──► v1 (2027-07) ──► v1 (2028-07) ──► v1 sunset
     │                │                  │
     ▼                ▼                  ▼
  Released       Deprecated           Removed
     │
     └── v2 (2027-07) ──► v2 (2028-07) ──► ...
```

## Cross-References

- [api-standards.md](./api-standards.md) — URL structure
- [future-api.md](./future-api.md) — Planned future API changes
