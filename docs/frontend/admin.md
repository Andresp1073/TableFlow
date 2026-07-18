# Platform Administration Module

## Overview

The Platform Administration module provides a comprehensive admin panel for managing the TableFlow platform. It includes user management, role-based access control, permission management, restaurant configuration, audit viewing, notification settings, and system preferences.

## Architecture

### Backend

The admin backend module (`apps/backend/src/modules/admin/`) follows the same presentation-layer pattern as other modules:

- **`admin.repository.ts`** — Extends `BaseRepository` for direct Prisma queries on User, Role, Permission, UserRole, and RolePermission tables
- **`admin.controller.ts`** — Express handlers using `asyncHandler` and response utilities
- **`admin.routes.ts`** — Express router mounted at `/api/v1/admin`, all routes require `requireAuth` + `requireRole('Super Admin')`
- **`admin.validation.ts`** — Zod schemas for request validation
- **`admin.types.ts`** — DTO interfaces shared between controller and repository

### API Endpoints

All endpoints require JWT authentication and the "Super Admin" role.

#### Platform Stats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/stats` | Platform-wide statistics (users, restaurants, roles, permissions, sessions) |

#### User Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/users` | List users with pagination, search, role/status filters |
| GET | `/api/v1/admin/users/:userId` | Get user detail with role assignments |
| POST | `/api/v1/admin/users` | Create user with password hashing |
| PATCH | `/api/v1/admin/users/:userId` | Update user profile fields |
| PATCH | `/api/v1/admin/users/:userId/deactivate` | Deactivate user |
| PATCH | `/api/v1/admin/users/:userId/activate` | Activate user (clears lock) |
| PATCH | `/api/v1/admin/users/:userId/roles` | Replace user role assignments |
| POST | `/api/v1/admin/users/:userId/reset-password` | Admin-initiated password reset |

#### Role Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/roles` | List all roles (optional `restaurantId` filter) |
| GET | `/api/v1/admin/roles/:roleId` | Get role detail with user/permission counts |
| POST | `/api/v1/admin/roles` | Create new role |
| PATCH | `/api/v1/admin/roles/:roleId` | Update role (system roles protected) |
| DELETE | `/api/v1/admin/roles/:roleId` | Delete role (system roles protected) |
| GET | `/api/v1/admin/roles/:roleId/permissions` | Get permissions assigned to role |
| PUT | `/api/v1/admin/roles/:roleId/permissions` | Replace all permissions for a role |

#### Permission Viewer
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/permissions` | List all permissions (optional `module` filter) |
| GET | `/api/v1/admin/permissions/groups` | Permissions grouped by module |

### Query Parameters

- **Users**: `page`, `limit`, `search` (email, firstName, lastName), `role` (code), `status` (active, inactive, locked, all)
- **Roles**: `restaurantId` (UUID)
- **Permissions**: `module` (string)

### Frontend

The frontend admin module follows the feature-based architecture:

- **`lib/admin-types.ts`** — TypeScript types, status utilities, risk level colors
- **`services/admin.ts`** — API service functions (17 methods covering all endpoints)
- **`hooks/use-admin.ts`** — 16 TanStack Query hooks with 15-60s stale times
- **`components/admin/`** — Shared components:
  - `AdminPageLayout` — Page header with title, description, actions
  - `AdminSidebar` — Admin navigation sidebar with 8 links
  - `UserStatusBadge` — Status badge (active/inactive/locked) with colors
  - `UserForm` — Create/edit user form with role multi-select
  - `RoleForm` — Create/edit role form with code, name, description, priority, color
  - `PermissionMatrix` — Interactive permission grid with search, select all, risk-level badges

### Pages

All pages under `app/(protected)/admin/`:

| Path | Component | Features |
|------|-----------|----------|
| `/admin` | Platform Dashboard | Stats cards, quick links |
| `/admin/users` | User List | Search, status filter, pagination, activate/deactivate |
| `/admin/users/new` | Create User | Form with email, password, name, role assignment |
| `/admin/users/[userId]` | User Detail | Profile, roles, activate/deactivate, reset password |
| `/admin/roles` | Role List | Cards with user/permission counts, delete |
| `/admin/roles/new` | Create Role | Form with code, name, description, priority, color |
| `/admin/roles/[roleId]` | Role Detail | Edit role info, full permission matrix |
| `/admin/permissions` | Permissions Viewer | Grouped by module, search, risk level |
| `/admin/restaurants` | Restaurant Config | Links to existing restaurant pages |
| `/admin/audit` | Audit Log | Module/action filters, pagination, color-coded actions |
| `/admin/notifications` | Notifications | Channel cards, template list |
| `/admin/settings` | System Preferences | Localization, appearance, security, billing |

### Navigation

The admin section is in the System group with 8 sub-items: Dashboard, Users, Roles, Permissions, Restaurants, Audit, Notifications, Settings.

## Security

- All admin routes require `requireAuth` (JWT verification) and `requireRole('Super Admin')`
- System roles cannot be modified or deleted
- Password reset validates minimum 8 characters
- User deactivation prevents login but preserves data
- Account unlocking clears `lockedAt`, `lockedUntil`, `lockReason`, and resets `failedLoginAttempts`

## Reusing Existing APIs

The admin module reuses existing backend APIs:

- **Audit log**: `/api/v1/audit` (existing audit module)
- **Restaurant management**: `/api/v1/restaurants` (existing restaurant module)
- **Auth sessions**: `/api/v1/auth/sessions` (existing auth module)
- **User unlock**: `/api/v1/auth/users/:userId/unlock` (existing auth module)
