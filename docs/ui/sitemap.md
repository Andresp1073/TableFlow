# Sitemap

**Last updated:** 2026-07-04

## Public Pages

| Path | Page | Access |
|------|------|--------|
| `/login` | Login | Public |
| `/register` | Organization registration | Public |
| `/forgot-password` | Password reset request | Public |
| `/reset-password` | Password reset form | Public (token) |
| `/verify-email` | Email verification | Public (token) |
| `/booking/:orgSlug` | Public booking widget | Public |
| `/booking/:orgSlug/confirm` | Booking confirmation | Public |

## Authenticated Pages (Staff)

| Path | Page | Permission |
|------|------|------------|
| `/` | Dashboard (role-aware) | All |
| `/search` | Global search results | All |

### Reservations

| Path | Page | Permission |
|------|------|------------|
| `/reservations` | Reservation list | `reservations.read` |
| `/reservations?date=today` | Today's reservations | `reservations.read` |
| `/reservations/calendar` | Calendar view | `reservations.read` |
| `/reservations/availability` | Availability checker | `reservations.read` |

### Customers

| Path | Page | Permission |
|------|------|------------|
| `/customers` | Customer list | `customers.read` |
| `/customers/:id` | Customer detail | `customers.read` |
| `/customers/:id/reservations` | Customer reservation history | `customers.read` |

### Tables

| Path | Page | Permission |
|------|------|------------|
| `/branches/:branchId/tables` | Table list | `tables.read` |
| `/branches/:branchId/tables/floor-plan` | Floor plan view | `tables.read` |
| `/branches/:branchId/tables/zones` | Zone management | `tables.read` |

### Branches

| Path | Page | Permission |
|------|------|------------|
| `/branches` | Branch list | `branches.read` |
| `/branches/:id` | Branch detail | `branches.read` |
| `/branches/:id/settings` | Branch settings | `branches.update` |
| `/branches/:id/holiday-hours` | Holiday hours | `branches.update` |

### Staff (Users)

| Path | Page | Permission |
|------|------|------------|
| `/users` | User list | `users.read` |
| `/users/:id` | User detail | `users.read` |
| `/roles` | Role list | `roles.read` |

### Reports

| Path | Page | Permission |
|------|------|------------|
| `/reports` | Reports landing | `reports.view` |
| `/reports/daily` | Daily summary | `reports.view` |
| `/reports/period` | Period summary | `reports.view` |
| `/reports/export` | Report export | `reports.export` |

### Notifications

| Path | Page | Permission |
|------|------|------------|
| `/notifications` | Notification history | `notifications.view_log` |
| `/notifications/settings` | Notification preferences | `settings.update` |

### Settings

| Path | Page | Permission |
|------|------|------------|
| `/settings` | Settings landing | `settings.read` |
| `/settings/organization` | Organization settings | `settings.update` |
| `/settings/policies` | Booking policies | `settings.update` |
| `/settings/integrations` | Integration config | `settings.update` |
| `/settings/webhooks` | Webhook management | `settings.update` |
| `/settings/notifications` | Notification templates | `settings.update` |

### Audit Logs

| Path | Page | Permission |
|------|------|------------|
| `/audit-logs` | Audit log viewer | `audit.read` |

## Admin Pages (System Admin)

| Path | Page | Permission |
|------|------|------------|
| `/admin` | Admin dashboard | System admin |
| `/admin/organizations` | Organization list | System admin |
| `/admin/organizations/:id` | Organization detail | System admin |
| `/admin/users` | System user management | System admin |
| `/admin/system` | System configuration | System admin |

## Page Types

| Type | Description | Examples |
|------|-------------|---------|
| **List** | Paginated table with filters | `/users`, `/branches` |
| **Detail** | Single entity view | `/users/:id` |
| **Dashboard** | KPI widgets + quick actions | `/` |
| **Form** | Configuration/settings | `/settings/*` |
| **Calendar** | Date-based view | `/reservations/calendar` |
| **Floor Plan** | Visual table layout | `/branches/:id/tables/floor-plan` |
| **Modal** | Create/edit overlay | Triggered from list pages |

## Cross-References

- [information-architecture.md](./information-architecture.md) — Navigation hierarchy
- [navigation-system.md](./navigation-system.md) — Navigation components
