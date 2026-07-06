# Module Architecture

**Last updated:** 2026-07-04

## Generic Module Template

Every module follows the same internal structure:

```
modules/{feature}/
├── {feature}.controller.ts      # HTTP handlers
├── {feature}.service.ts         # Business logic
├── {feature}.repository.ts      # Data access
├── {feature}.routes.ts          # Route definitions
├── {feature}.validator.ts       # Zod request schemas
├── {feature}.dto.ts             # Data Transfer Objects
├── {feature}.types.ts           # Types and enums
├── {feature}.interfaces.ts      # Interface contracts
├── __tests__/
│   ├── {feature}.service.test.ts
│   └── {feature}.controller.test.ts
└── index.ts                     # Module public API
```

---

## Module Definitions

### 1. Auth

| Aspect | Detail |
|--------|--------|
| **Purpose** | User identity, registration, login, logout, token management |
| **Files** | `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`, `auth.routes.ts`, `auth.validator.ts`, `auth.dto.ts`, `auth.types.ts`, `auth.interfaces.ts` |

Key responsibilities:
- Register new users with email verification.
- Authenticate with email/password (JWT issuance).
- Refresh access tokens.
- Logout (token invalidation).
- Password reset flow.
- Account lockout management.

**Public interface (from `index.ts`):**
```typescript
export { authRoutes } from './auth.routes';
export { AuthService } from './auth.service';
export { IAuthService } from './auth.interfaces';
// Types: LoginDTO, RegisterDTO, TokenResponse, RefreshTokenDTO
```

---

### 2. Users

| Aspect | Detail |
|--------|--------|
| **Purpose** | User account lifecycle and profile management |
| **Files** | `users.controller.ts`, `users.service.ts`, `users.repository.ts`, `users.routes.ts`, `users.validator.ts`, `users.dto.ts`, `users.types.ts` |

Key responsibilities:
- CRUD user accounts.
- Account activation/deactivation.
- Profile management.
- Staff invitation workflow (creates account, sends email).

---

### 3. Roles

| Aspect | Detail |
|--------|--------|
| **Purpose** | Role definitions and permission management |
| **Files** | `roles.controller.ts`, `roles.service.ts`, `roles.repository.ts`, `roles.routes.ts`, `roles.validator.ts`, `roles.dto.ts`, `roles.types.ts` |

Key responsibilities:
- Pre-defined roles (Customer, Waiter, Receptionist, Manager, Admin, Support, SysAdmin).
- Custom role creation.
- Permission assignment.
- Role-permission caching.

---

### 4. Restaurants

| Aspect | Detail |
|--------|--------|
| **Purpose** | Restaurant organization management |
| **Files** | `restaurants.controller.ts`, `restaurants.service.ts`, `restaurants.repository.ts`, `restaurants.routes.ts`, `restaurants.validator.ts`, `restaurants.dto.ts`, `restaurants.types.ts` |

Key responsibilities:
- Create and manage restaurant organizations.
- Organization-level settings (timezone, locale).
- Multi-tenant isolation at the organization level.

---

### 5. Branches

| Aspect | Detail |
|--------|--------|
| **Purpose** | Physical restaurant branch management |
| **Files** | `branches.controller.ts`, `branches.service.ts`, `branches.repository.ts`, `branches.routes.ts`, `branches.validator.ts`, `branches.dto.ts`, `branches.types.ts` |

Key responsibilities:
- CRUD branches under an organization.
- Operating hours and holiday scheduling.
- Reservation policy configuration (advance booking window, slot intervals, cancellation policy).
- Branch-level settings.

---

### 6. Tables

| Aspect | Detail |
|--------|--------|
| **Purpose** | Table configuration and floor plan management |
| **Files** | `tables.controller.ts`, `tables.service.ts`, `tables.repository.ts`, `tables.routes.ts`, `tables.validator.ts`, `tables.dto.ts`, `tables.types.ts` |

Key responsibilities:
- CRUD tables (number, capacity, zone, position).
- Table status management (available, occupied, reserved, cleaning, out of service).
- Table merging/splitting.
- Floor plan layout configuration.
- Real-time availability check.

---

### 7. Reservations

| Aspect | Detail |
|--------|--------|
| **Purpose** | Full reservation lifecycle |
| **Files** | `reservations.controller.ts`, `reservations.service.ts`, `reservations.repository.ts`, `reservations.routes.ts`, `reservations.validator.ts`, `reservations.dto.ts`, `reservations.types.ts`, `reservations.interfaces.ts` |

Key responsibilities:
- Create, read, update, cancel reservations.
- Table availability search.
- Manual and auto table assignment.
- Check-in, check-out, no-show.
- Walk-in reservations.
- Recurring reservations.
- Overlapping slot detection.
- Business rule enforcement (party size, opening hours, cancellation window).

**Business logic criticality:** HIGH (most complex module)

---

### 8. Customers

| Aspect | Detail |
|--------|--------|
| **Purpose** | Customer profile management |
| **Files** | `customers.controller.ts`, `customers.service.ts`, `customers.repository.ts`, `customers.routes.ts`, `customers.validator.ts`, `customers.dto.ts`, `customers.types.ts` |

Key responsibilities:
- CRUD customer profiles.
- Duplicate detection and merging.
- Visit history tracking.
- No-show and cancellation counting.
- Customer flagging (high-risk no-show).

---

### 9. Notifications

| Aspect | Detail |
|--------|--------|
| **Purpose** | Automated email and in-app notifications |
| **Files** | `notifications.controller.ts`, `notifications.service.ts`, `notifications.repository.ts`, `notifications.routes.ts`, `notifications.validator.ts`, `notifications.dto.ts`, `notifications.types.ts` |

Key responsibilities:
- Reservation confirmation emails.
- 24-hour reminder emails.
- Cancellation and modification notifications.
- In-app notification delivery.
- Notification template management.
- Delivery status tracking.

---

### 10. Reports

| Aspect | Detail |
|--------|--------|
| **Purpose** | Business analytics and reporting |
| **Files** | `reports.controller.ts`, `reports.service.ts`, `reports.repository.ts`, `reports.routes.ts`, `reports.validator.ts`, `reports.dto.ts`, `reports.types.ts` |

Key responsibilities:
- Report generation (daily, weekly, monthly).
- KPI calculation (occupancy rate, turn time, no-show rate).
- Peak hours analysis.
- Customer frequency analysis.
- CSV and PDF export.

---

### 11. Dashboard

| Aspect | Detail |
|--------|--------|
| **Purpose** | Real-time operational overview |
| **Files** | `dashboard.controller.ts`, `dashboard.service.ts`, `dashboard.repository.ts`, `dashboard.routes.ts`, `dashboard.dto.ts`, `dashboard.types.ts` |

Key responsibilities:
- Today's reservation count and progress.
- Current occupancy rate.
- Upcoming reservations list.
- Table status summary.
- Quick reservation actions.

---

### 12. Settings

| Aspect | Detail |
|--------|--------|
| **Purpose** | Branch and system configuration |
| **Files** | `settings.controller.ts`, `settings.service.ts`, `settings.repository.ts`, `settings.routes.ts`, `settings.validator.ts`, `settings.dto.ts`, `settings.types.ts` |

Key responsibilities:
- General settings (name, contact info, timezone).
- Reservation policies.
- Notification preferences.
- Business hours configuration.
- Integration settings.

---

### 13. Audit

| Aspect | Detail |
|--------|--------|
| **Purpose** | Immutable event traceability |
| **Files** | `audit.controller.ts`, `audit.service.ts`, `audit.repository.ts`, `audit.routes.ts`, `audit.dto.ts`, `audit.types.ts` |

Key responsibilities:
- Log creation events (reservation, auth, config changes).
- Audit log queries and filtering.
- Retention policy enforcement.
- Export audit logs.

---

## Cross-Module Dependencies

```
Auth ──────────► Users (creates user records)
Users ─────────► Roles (assigns roles)
Roles ─────────► Auth (checks permissions)
Restaurants ───► Branches (contains branches)
Branches ───────► Tables (contains tables)
Branches ───────► Reservations (receives reservations)
Reservations ──► Tables (assigns tables)
Reservations ──► Customers (links to customer)
Reservations ──► Notifications (triggers notifications)
Reports ────────► Reservations, Customers, Tables (reads data)
Dashboard ─────► Reservations, Tables (aggregates data)
Audit ──────────► All (receives events)
```

**Rules:**
- A module depends on another module's public interface only.
- No circular dependencies allowed.
- If module A needs module B, and module B needs module A, extract the shared logic into `common/`.

---

## Module Size Guidelines

| Module | Estimated Complexity | Lines of Service Code (expected) |
|--------|---------------------|----------------------------------|
| Auth | Medium | 250-400 |
| Users | Low | 100-200 |
| Roles | Low | 150-250 |
| Restaurants | Low | 100-200 |
| Branches | Medium | 200-350 |
| Tables | Medium | 200-350 |
| Reservations | High | 400-700 |
| Customers | Medium | 150-300 |
| Notifications | Low | 100-200 |
| Reports | Medium | 200-400 |
| Dashboard | Low | 100-200 |
| Settings | Low | 100-200 |
| Audit | Low | 100-200 |

---

## Related Documents

- [backend-architecture.md](./backend-architecture.md) — Backend folder structure
- [dependency-rules.md](./dependency-rules.md) — Module dependency rules
- [design-patterns.md](./design-patterns.md) — Patterns used in modules
