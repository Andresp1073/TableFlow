# Permission Matrix

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access |
| 👁️ | Read-only or limited access |
| — | No access |

---

## Module: Authentication

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `auth.register` | ✅ | — | — | — | — | — | ✅ |
| `auth.login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.logout` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.refresh` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.resetPassword` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.changePassword` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Module: Users

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `users.create` | — | — | — | — | ✅ | — | ✅ |
| `users.read` | 👁️ (own) | 👁️ (own) | 👁️ (own) | 👁️ (own + staff in branch) | ✅ (organization) | 👁️ (read) | ✅ |
| `users.update` | ✅ (own) | 👁️ (own limited) | 👁️ (own limited) | 👁️ (own limited) | ✅ | — | ✅ |
| `users.delete` | — | — | — | — | ✅ | — | ✅ |
| `users.disable` | — | — | — | — | ✅ | — | ✅ |
| `users.enable` | — | — | — | — | ✅ | — | ✅ |
| `users.list` | — | 👁️ (section) | 👁️ (branch) | ✅ (branch) | ✅ (organization) | ✅ (read) | ✅ |
| `users.changeRole` | — | — | — | — | ✅ (branch) | — | ✅ |
| `users.invite` | — | — | — | — | ✅ | — | ✅ |

---

## Module: Roles & Permissions

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `roles.create` | — | — | — | — | — | — | ✅ |
| `roles.read` | — | — | — | 👁️ (assigned) | ✅ (organization) | ✅ (read) | ✅ |
| `roles.update` | — | — | — | — | — | — | ✅ |
| `roles.delete` | — | — | — | — | — | — | ✅ |
| `roles.list` | — | — | — | 👁️ (branch) | ✅ (organization) | ✅ | ✅ |
| `roles.assign` | — | — | — | — | ✅ (branch) | — | ✅ |

---

## Module: Restaurants

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `restaurants.create` | — | — | — | — | — | — | ✅ |
| `restaurants.read` | 👁️ (public) | 👁️ (assigned) | 👁️ (assigned) | ✅ (assigned) | ✅ (owned) | ✅ (read) | ✅ |
| `restaurants.update` | — | — | — | — | ✅ (owned) | — | ✅ |
| `restaurants.delete` | — | — | — | — | — | — | ✅ |
| `restaurants.list` | 👁️ (public) | 👁️ (assigned) | 👁️ (assigned) | ✅ (owned) | ✅ (owned) | ✅ | ✅ |

---

## Module: Branches

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `branches.create` | — | — | — | — | ✅ | — | ✅ |
| `branches.read` | 👁️ (public) | ✅ (assigned) | ✅ (assigned) | ✅ (assigned) | ✅ (owned) | ✅ (read) | ✅ |
| `branches.update` | — | — | — | — | ✅ (owned) | — | ✅ |
| `branches.delete` | — | — | — | — | — | — | ✅ |
| `branches.list` | 👁️ (public) | ✅ (assigned) | ✅ (assigned) | ✅ (owned) | ✅ (owned) | ✅ | ✅ |
| `branches.configureHours` | — | — | — | — | ✅ | — | ✅ |
| `branches.configurePolicies` | — | — | — | — | ✅ | — | ✅ |

---

## Module: Tables

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `tables.create` | — | — | — | ✅ | ✅ | — | ✅ |
| `tables.read` | — | ✅ (section) | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| `tables.update` | — | — | — | ✅ | ✅ | — | ✅ |
| `tables.delete` | — | — | — | ✅ | ✅ | — | ✅ |
| `tables.list` | 👁️ (public) | ✅ (section) | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| `tables.assign` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `tables.release` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `tables.updateStatus` | — | ✅ (section) | ✅ | ✅ | ✅ | — | ✅ |
| `tables.merge` | — | — | — | ✅ | ✅ | — | ✅ |
| `tables.split` | — | — | — | ✅ | ✅ | — | ✅ |
| `tables.disable` | — | — | — | ✅ | ✅ | — | ✅ |
| `tables.configureLayout` | — | — | — | — | ✅ | — | ✅ |

---

## Module: Reservations

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `reservations.create` | ✅ (own) | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.read` | ✅ (own) | 👁️ (section) | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| `reservations.update` | ✅ (own) | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.delete` | — | — | — | ✅ | ✅ | — | ✅ |
| `reservations.cancel` | ✅ (own) | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.confirm` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.checkIn` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.checkOut` | — | ✅ (section) | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.markNoShow` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.list` | ✅ (own) | 👁️ (section) | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| `reservations.searchAvailability` | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅ |
| `reservations.autoAssign` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.manageRecurring` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.addNotes` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.manageWalkIn` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `reservations.overrideBlock` | — | — | — | ✅ | ✅ | — | ✅ |

---

## Module: Customers

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `customers.create` | ✅ (own) | — | ✅ | ✅ | ✅ | — | ✅ |
| `customers.read` | ✅ (own) | 👁️ (assigned) | ✅ | ✅ | ✅ | 👁️ (limited) | ✅ |
| `customers.update` | ✅ (own) | — | 👁️ (basic) | ✅ | ✅ | — | ✅ |
| `customers.delete` | — | — | — | 👁️ (branch) | ✅ | — | ✅ |
| `customers.list` | — | — | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| `customers.merge` | — | — | — | — | ✅ | — | ✅ |
| `customers.flag` | — | — | — | ✅ | ✅ | — | ✅ |
| `customers.addNotes` | — | — | ✅ | ✅ | ✅ | — | ✅ |
| `customers.export` | — | — | — | ✅ | ✅ | — | ✅ |

---

## Module: Notifications

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `notifications.send` | — | — | — | ✅ | ✅ | — | ✅ |
| `notifications.viewLog` | — | — | 👁️ (branch) | ✅ | ✅ | ✅ (read) | ✅ |
| `notifications.configureTemplates` | — | — | — | — | ✅ | — | ✅ |
| `notifications.configurePreferences` | — | — | — | — | ✅ | — | ✅ |
| `notifications.retry` | — | — | — | ✅ | ✅ | — | ✅ |

---

## Module: Reports & Analytics

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `reports.view` | — | — | 👁️ (operational) | ✅ | ✅ | ✅ (read) | ✅ |
| `reports.export` | — | — | — | ✅ | ✅ | — | ✅ |
| `reports.viewDashboard` | — | — | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| `reports.configureMetrics` | — | — | — | — | ✅ | — | ✅ |
| `reports.schedule` | — | — | — | — | ✅ | — | ✅ |

---

## Module: Dashboard

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `dashboard.view` | — | ✅ (section) | ✅ | ✅ | ✅ | 👁️ | ✅ |
| `dashboard.customize` | — | — | — | 👁️ (limited) | ✅ | — | ✅ |

---

## Module: Settings

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `settings.view` | — | — | 👁️ (limited) | ✅ | ✅ | ✅ (read) | ✅ |
| `settings.updateGeneral` | — | — | — | — | ✅ | — | ✅ |
| `settings.updateReservationPolicies` | — | — | — | — | ✅ | — | ✅ |
| `settings.updateNotificationPreferences` | — | — | — | — | ✅ | — | ✅ |
| `settings.updateBusinessHours` | — | — | — | — | ✅ | — | ✅ |
| `settings.manageIntegrations` | — | — | — | — | ✅ | — | ✅ |

---

## Module: Audit Logs

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `audit.read` | — | — | — | 👁️ (branch) | ✅ (organization) | ✅ (read) | ✅ |
| `audit.readSensitive` | — | — | — | — | — | — | ✅ |
| `audit.export` | — | — | — | — | 👁️ (organization) | — | ✅ |
| `audit.configureRetention` | — | — | — | — | — | — | ✅ |

---

## Module: Organizations

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `organizations.create` | — | — | — | — | — | — | ✅ |
| `organizations.read` | — | — | — | — | ✅ (own) | ✅ (read) | ✅ |
| `organizations.update` | — | — | — | — | 👁️ (own limited) | — | ✅ |
| `organizations.delete` | — | — | — | — | — | — | ✅ |
| `organizations.list` | — | — | — | — | 👁️ (own) | ✅ | ✅ |
| `organizations.manageSubscription` | — | — | — | — | 👁️ (view) | — | ✅ |

---

## Module: System

| Permission | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|------------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| `system.viewHealth` | — | — | — | — | 👁️ | 👁️ | ✅ |
| `system.manageBackup` | — | — | — | — | — | — | ✅ |
| `system.manageRecovery` | — | — | — | — | — | — | ✅ |
| `system.viewLogs` | — | — | — | — | — | 👁️ (app logs) | ✅ |
| `system.configureGlobal` | — | — | — | — | — | — | ✅ |

---

## Summary: Permission Count by Role

| Role | Granted Count | Percentage |
|------|-------------|------------|
| Customer | 16 | ~15% |
| Waiter | 17 | ~16% |
| Receptionist | 40 | ~39% |
| Restaurant Manager | 62 | ~60% |
| Restaurant Administrator | 92 | ~89% |
| Support | 51 | ~50% |
| System Administrator | 103 | 100% |
