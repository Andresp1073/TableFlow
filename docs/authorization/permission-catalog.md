# Enterprise Permission Catalog

## Overview

The Permission Catalog defines every granular permission in the TableFlow RBAC system. Each permission is identified by a unique dot-notation `code` (e.g., `users.create`) and has a human-readable `name` (e.g., "Create Users").

## Permission Model

| Field        | Type     | Description                                    |
|-------------|----------|------------------------------------------------|
| `id`        | UUID     | Primary key                                    |
| `code`      | String   | Unique dot-notation identifier (`unique`)      |
| `name`      | String   | Human-readable display name                    |
| `description` | Text   | Detailed description of the permission         |
| `module`    | String   | Functional module grouping (e.g., `users`)     |
| `resource`  | String   | Resource type this permission governs          |
| `action`    | String   | Operation permitted on the resource            |
| `riskLevel` | Enum     | `low`, `medium`, `high`, `critical`            |
| `isSystem`  | Boolean  | Whether this is a system-defined permission    |
| `createdAt` | DateTime | When the permission was created                |
| `updatedAt` | DateTime | When the permission was last modified          |

## Code Convention

Permissions follow `{resource}.{action}` dot notation:

- `users.create` — resource=`users`, action=`create`
- `reservations.checkIn` — resource=`reservations`, action=`checkIn`
- `branches.configureHours` — resource=`branches`, action=`configureHours`

## Modules

| Module          | Resource         | Permissions Count |
|----------------|------------------|------------------|
| Authentication | auth             | 6                |
| Users          | users            | 9                |
| Roles          | roles            | 6                |
| Restaurants    | restaurants      | 5                |
| Branches       | branches         | 7                |
| Tables         | tables           | 12               |
| Reservations   | reservations     | 16               |
| Customers      | customers        | 9                |
| Notifications  | notifications    | 5                |
| Reports        | reports          | 5                |
| Dashboard      | dashboard        | 2                |
| Settings       | settings         | 6                |
| Audit Logs     | audit            | 4                |
| Organizations  | organizations    | 6                |
| System         | system           | 5                |

## Risk Levels

- **Low** — Non-sensitive read operations (e.g., `dashboard.view`)
- **Medium** — Data modifications, standard operations (e.g., `reservations.create`)
- **High** — Destructive or privacy-sensitive operations (e.g., `users.delete`, `audit.read`)
- **Critical** — System-wide impact, tenant management (e.g., `organizations.delete`, `system.manageBackup`)

## Adding a New Permission

1. Determine the `{resource}.{action}` code following the established convention
2. Derive the display `name` using `<Action> <Resource>` format (e.g., "Create Users")
3. Assign the appropriate `module`, `riskLevel`, `resource`, and `action`
4. Add the entry to `prisma/seed/permissions.seed.ts`
5. Assign the permission to roles in `prisma/seed/role-permissions.seed.ts`
6. Run the seed command to upsert
7. Use `validatePermissionCatalogEntry()` to validate before inserting

## Validation Rules

- `code` must match `{resource}.{action}` format
- `code` must use lowercase for the resource segment
- `code` must not exceed 150 characters
- `name` must not exceed 200 characters
- `module` must be one of the known modules
- `riskLevel` must be `low`, `medium`, `high`, or `critical`
- `code` must not start with reserved prefixes (`_`, `system.`, `internal.`)
