# Future API Considerations

**Last updated:** 2026-07-04

## Phase 6 — Payments

| Change | Impact |
|--------|--------|
| Add `payments` and `payment_methods` endpoints | New module under `/api/v1/payments` |
| Add `paymentStatus` field to reservations | Additive field — backward compatible |
| Deposit/hold endpoints | `POST /api/v1/reservations/{id}/hold-payment` |
| Refund endpoints | `POST /api/v1/reservations/{id}/refund` |

## Phase 7 — Customer Portal / Self-Service

| Change | Impact |
|--------|--------|
| Customer authentication (email + confirmation code) | New auth endpoints under `/api/v1/auth/customer` |
| Customer-facing reservation management | Limited scope endpoints |
| Customer profile self-service | `PATCH /api/v1/customers/me` |

## Phase 8 — Multi-Language / Multi-Currency

| Change | Impact |
|--------|--------|
| `Accept-Language` header support | Localized error messages |
| `Currency` header or query param | Monetary value formatting |
| Translation endpoints | `GET /api/v1/translations/{locale}` |

## Phase 9 — Advanced Reporting

| Change | Impact |
|--------|--------|
| Report scheduling | `POST /api/v1/reports/schedules` |
| Report export formats (PDF, Excel) | `Accept: application/pdf` support |
| Custom report builder | `POST /api/v1/reports/custom` |
| Report sharing | `POST /api/v1/reports/{id}/share` |

## Phase 10 — Integrations

| Change | Impact |
|--------|--------|
| POS integration endpoints | `POST /api/v1/integrations/pos` |
| Third-party calendar sync | Webhook enhancements |
| Export/Import APIs | Bulk data endpoints |

## Backward Compatibility Commitment

- All Phase 6+ additions will be additive-only within `v1`
- New fields appear in responses but are not required in requests
- No existing fields will be removed or renamed within `v1`
- Deprecation will be announced 6+ months before any breaking change

## Cross-References

- [versioning.md](./versioning.md) — Versioning policy
- [endpoint-catalog.md](./endpoint-catalog.md) — Current endpoint design
