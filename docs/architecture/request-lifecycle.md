# Request Lifecycle

**Last updated:** 2026-07-04

## End-to-End Request Flow

This document traces a complete request from browser to database and back.

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                            │
│  1. User clicks "Create Reservation"                                │
│  2. React Router navigates to /reservations/new                    │
│  3. ReservationCreatePage renders ReservationForm                  │
│  4. User fills form → React Hook Form manages state                │
│  5. User submits → Zod validates client-side                       │
│  6. useCreateReservation hook calls reservationService.create()    │
│  7. Axios sends POST /api/v1/reservations                          │
│     - Authorization: Bearer <access_token>                         │
│     - Content-Type: application/json                               │
│     - Body: { customerId, date, time, partySize, branchId }        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXPRESS MIDDLEWARE PIPELINE                                        │
│                                                                     │
│  8. helmet() → Security headers added                               │
│  9. cors() → CORS headers validated                                 │
│ 10. express.json() → JSON body parsed                              │
│ 11. requestLogger → Log: POST /api/v1/reservations                 │
│ 12. authMiddleware → Extract JWT, verify signature,                │
│                      check expiration, extract user payload        │
│     └─ Invalid/Expired → 401 Unauthorized                          │
│ 13. rbacMiddleware → Check 'reservations.create' permission        │
│     └─ Not authorized → 403 Forbidden                              │
│ 14. validateMiddleware → Validate body against Zod schema          │
│     └─ Invalid → 400 Bad Request + field errors                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONTROLLER (reservation.controller.ts)                             │
│                                                                     │
│ 15. Extract validated DTO from request body                        │
│ 16. Extract user ID from request (set by auth middleware)          │
│ 17. Call reservationService.create(dto, userId)                    │
│ 18. Format response: { data: reservation, status: 201 }            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SERVICE (reservation.service.ts)                                   │
│                                                                     │
│ 19. Validate business rules:                                        │
│     - Check branch exists                                           │
│     - Check branch is open at requested time                        │
│     - Check date is within advance booking window                   │
│     - Check party size ≤ max allowed                                │
│     - Check customer exists (or create if new)                      │
│     └─ Any rule fails → throw BusinessRuleError (422)              │
│ 20. Search available tables for requested time/slot                │
│     - If no tables → throw NoAvailabilityError (409)               │
│ 21. Auto-assign best available table                               │
│     - Or use manual assignment if provided                         │
│ 22. Call repository.create(reservationData)                        │
│ 23. Return created reservation entity                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  REPOSITORY (reservation.repository.ts)                             │
│                                                                     │
│ 24. Build Prisma query with nested includes:                        │
│     - customer, table, branch                                       │
│ 25. Execute: prisma.reservation.create({ data, include })          │
│ 26. Check for unique constraint violations:                         │
│     - Overlapping reservation on same table → Prisma throws        │
│ 27. Return created reservation entity                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PRISMA → MySQL                                                     │
│                                                                     │
│ 28. Prisma generates SQL: INSERT INTO reservations (...)            │
│ 29. MySQL executes transaction:                                     │
│     - INSERT reservation                                            │
│     - INSERT table_reservation (join table)                         │
│     - UPDATE table status (optional)                                │
│ 30. MySQL returns inserted row                                      │
│ 31. Prisma maps row to TypeScript entity                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RESPONSE (back to browser)                                         │
│                                                                     │
│ 32. Repository returns reservation entity to service               │
│ 33. Service returns entity to controller                            │
│ 34. Controller formats response:                                    │
│     { "data": { "id": "...", "status": "CONFIRMED", ... } }       │
│ 35. Express sends 201 response                                      │
│                                                                     │
│ 36. BROWSER receives response                                       │
│ 37. Axios interceptor: check status, transform response            │
│ 38. TanStack Query: cache invalidated, data updated                │
│ 39. Toast notification: "Reservation created successfully"          │
│ 40. React Router navigates to /reservations/:id                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Timing Breakdown (Target)

| Step | Component | Target Time |
|------|-----------|-------------|
| 8-14 | Middleware pipeline | < 5ms |
| 15-18 | Controller | < 2ms |
| 19-23 | Service (business logic) | < 50ms |
| 24-27 | Repository (Prisma query) | < 20ms |
| 28-31 | MySQL query + response | < 50ms |
| 32-35 | Response serialization | < 5ms |
| **Total** | **API request** | **< 200ms (p95)** |

---

## Request Types

| Request Type | Auth Required | Example |
|-------------|---------------|---------|
| Public | No | `POST /api/v1/auth/login` |
| Authenticated | Yes | `GET /api/v1/reservations` |
| Authenticated + RBAC | Yes + Permission | `POST /api/v1/settings` |
| System-only | Yes + SysAdmin role | `GET /api/v1/audit` |

---

## Error Flow

When an error occurs at any layer:

```
Service throws BusinessRuleError
        │
        ▼
Controller catches → passes to next(error)
        │
        ▼
errorHandler middleware:
  → Determine error type
  → Set HTTP status code
  → Format error response: { error: { status, code, message, details } }
  → Log error with context
  → Send response
```

---

## Related Documents

- [backend-architecture.md](./backend-architecture.md) — Backend layer details
- [error-handling.md](./error-handling.md) — Error handling strategy
- [logging-strategy.md](./logging-strategy.md) — Logging at each step
- [security-architecture.md](./security-architecture.md) — Auth middleware details
