# Breaking Changes Risk Assessment

**Last updated:** 2026-07-04

## Current State

The API is currently in **design phase** (no production consumers). Breaking change risk is assessed for:
1. Consistency issues that would become breaking if fixed later
2. Design decisions that limit future evolution
3. Patterns that would prevent backward-compatible changes

## Risk 1: Error Code Format Change

| Risk | Severity | Detail |
|------|----------|--------|
| Changing error code format later | 🔴 HIGH | If implemented with `AUTH_001` format, switching to `auth.token.missing` breaks all clients parsing error codes |

**Recommendation:** Settle the format NOW before any client integration. Recommended: dot-notation.

## Risk 2: Response Envelope `message` Field

| Risk | Severity | Detail |
|------|----------|--------|
| Adding/removing `message` field later | 🟡 MEDIUM | If implemented without `message`, adding it later is additive (backward compatible). If implemented WITH `message`, removing it is breaking. |

**Recommendation:** Implement without `message` (keep it additive-only). Update the OpenAPI spec to make `message` optional or remove it.

## Risk 3: RESERVATIONS DELETE URL

| Risk | Severity | Detail |
|------|----------|--------|
| Changing DELETE /reservations/{id} semantics | 🟡 MEDIUM | Currently overlaps with cancel. If cancel behavior diverges from DELETE later, clients using DELETE will behave differently. |

**Recommendation:** Either remove DELETE or make it a separate action with a different permission.

## Risk 4: Pagination Format

| Risk | Severity | Detail |
|------|----------|--------|
| Switching from offset to cursor pagination | 🔴 HIGH | Current design uses offset for most endpoints. Switching to cursor would break all paginated clients. |

**Recommendation:** Keep offset for current endpoints. Only use cursor for new high-volume endpoints.

## Risk 5: Nested Resource URLs

| Risk | Severity | Detail |
|------|----------|--------|
| Flattening nested URLs later | 🟡 MEDIUM | Tables at `/branches/{branchId}/tables` would be a breaking change if moved to `/tables?branchId=`. |

**Recommendation:** The nested URL is correct REST design. Keep it.

## Risk 6: Missing `updatedBy` Field

| Risk | Severity | Detail |
|------|----------|--------|
| Adding `updatedBy` later | 🟢 LOW | Additive field — fully backward compatible |

**Recommendation:** Add now for completeness, but no rush.

## Risk 7: Permission Name Changes

| Risk | Severity | Detail |
|------|----------|--------|
| Renaming permissions in JWT claims | 🔴 HIGH | If clients check for `reservations.assign_table` and it's renamed, all authZ breaks |

**Recommendation:** Finalize permission names now. Do not rename post-launch.

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| R1: Error code format change | High | High | Decide format now: use dot-notation |
| R2: Message field change | Medium | Low | Make `message` optional |
| R3: DELETE vs cancel confusion | Medium | Medium | Remove DELETE or separate permissions |
| R4: Pagination migration | Low | High | Keep offset, add cursor for new endpoints only |
| R5: URL flattening | Low | Medium | Keep nested, add aliases if needed |
| R6: Missing field addition | High | Low | Additive, no risk |
| R7: Permission rename | Low | High | Finalize names pre-launch |

## Recommendations

1. **Resolve error code format before implementation** — Highest priority
2. **Resolve `message` field before implementation** — Medium priority
3. **Remove `DELETE /reservations/{id}` or assign `reservations.delete`** — Medium priority
4. **Finalize permission names in JWT claims** — Before any token is issued

## Cross-References

- [naming-inconsistencies.md](./naming-inconsistencies.md) — Naming decisions
- [security-review.md](./security-review.md) — Permission decisions
- [final-recommendations.md](./final-recommendations.md) — Action plan
