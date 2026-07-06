# Role-Permission Assignment

## Overview

The Role-Permission Assignment module manages the many-to-many relationship between roles and permissions. Each `RolePermission` record represents a single permission granted to a role.

## Database Schema

```prisma
model RolePermission {
  id           String   @id @default(uuid()) @db.Char(36)
  roleId       String   @db.Char(36)
  permissionId String   @db.Char(36)
  createdAt    DateTime @default(now()) @db.DateTime(3)

  role       Role       @relation(fields: [roleId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

## Domain Model

```typescript
interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
}
```

## Service API

| Method | Description |
|---|---|
| `assignPermissionToRole(roleId, permissionId)` | Assigns a single permission to a role. Throws `DuplicateAssignmentError` if already assigned. |
| `assignPermissionsToRole(roleId, permissionIds)` | Batch assigns multiple permissions. Returns counts of assigned, skipped, and errors. |
| `removePermissionFromRole(roleId, permissionId)` | Removes a single permission from a role. |
| `removePermissionsFromRole(roleId, permissionIds)` | Batch removes multiple permissions. Returns count of removed. |
| `replaceRolePermissions(roleId, permissionIds)` | Atomically replaces all permissions on a role (delete all + create new). |
| `getRolePermissions(roleId)` | Lists all permission assignments for a role. |
| `getPermissionRoles(permissionId)` | Lists all role assignments for a permission. |
| `hasPermission(roleId, permissionId)` | Checks if a permission is assigned to a role. |

## Error Classes

| Error | Status | Code | When |
|---|---|---|---|
| `DuplicateAssignmentError` | 409 | `authz.assignment.duplicate` | Permission already assigned to role |

## Validation Rules

- **Non-deletable system roles** (`super-admin`, `platform-admin`, `support`) cannot have their permissions modified.
- **Duplicate assignments** are rejected — a permission can only be assigned once to a role.
- **Bulk validation** filters out existing assignments and reports missing permission IDs.

## Usage Example

```typescript
const repo = new RolePermissionRepositoryImpl();
const service = new RolePermissionServiceImpl(repo);

// Assign permissions to a restaurant-manager role
const result = await service.assignPermissionsToRole("role-rest-mgr", [
  "menu.read", "menu.write", "orders.read", "orders.write",
]);
// { assigned: 4, skipped: 0, errors: [] }

// Check if a role has a permission
const canReadMenu = await service.hasPermission("role-rest-mgr", "menu.read");
// true

// Replace all permissions atomically
await service.replaceRolePermissions("role-rest-mgr", [
  "menu.read", "menu.write", "orders.read",
]);

// Get all permissions for a role
const perms = await service.getRolePermissions("role-rest-mgr");
```

## Seed Data

The `role-permissions.seed.ts` file defines initial permission mappings for all seeded roles. Each mapping uses role code and permission code lookups to remain stable across renames.
