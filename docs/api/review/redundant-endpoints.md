# Redundant Endpoints

**Last updated:** 2026-07-04

## Endpoint Overlap Analysis

No strictly redundant endpoints were found. Each endpoint serves a distinct purpose.

## Near-Duplicates

| Endpoint A | Endpoint B | Relationship | Verdict |
|------------|------------|--------------|---------|
| `PUT /branches/{id}` | `PATCH /branches/{id}` | PUT = full replace, PATCH = partial update | ✅ Both needed per REST standards |
| `DELETE /reservations/{id}` | `POST /reservations/{id}/cancel` | DELETE = admin soft-delete, cancel = normal flow | ⚠️ **Confusing** — DELETE is rarely used, cancel is normal path |
| `POST /customers/{id}/flag` | `PATCH /customers/{id}` with `isFlagged` | flag endpoint is a specific action vs general update | ⚠️ **Potential overlap** — flag could be a PATCH field |

## Observations

### DELETE vs Cancel for Reservations

The `DELETE /api/v1/reservations/{id}` endpoint exists alongside `POST /api/v1/reservations/{id}/cancel`. Both require `reservations.cancel` permission. The DELETE endpoint is described as "admin only — prefer cancel" in the catalog.

**Risk:** Developers will naturally use `DELETE` for cancellation. This creates two paths to cancel a reservation with different semantics (cancel updates status to CANCELLED; DELETE soft-deletes and may bypass business logic).

**Recommendation:** Either:
1. Remove `DELETE /reservations/{id}` entirely (cancel is the correct path)
2. Change DELETE permission to `reservations.delete` (different from cancel)
3. Add explicit warning in OpenAPI description

### Flag vs PATCH for Customers

The `POST /customers/{id}/flag` duplicates what `PATCH /customers/{id} { isFlagged: true }` already achieves.

**Recommendation:** Consider removing the dedicated flag endpoint and handling flagging as part of standard PATCH. The dedicated endpoint adds convenience (with `reason` field) but creates two ways to accomplish the same thing.

## Conclusion

| Issue | Severity | Action |
|-------|----------|--------|
| DELETE vs Cancel overlap | 🟡 MEDIUM | Clarify or restrict DELETE |
| Flag vs PATCH overlap | 🔵 LOW | Keep both or remove flag endpoint |

## Cross-References

- [endpoint-catalog.md](../endpoint-catalog.md) — DELETE and cancel definitions
- [security-review.md](./security-review.md) — Permission consistency
