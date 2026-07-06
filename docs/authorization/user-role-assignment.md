# User Role Assignment

## Overview

The User Role Assignment system manages the lifecycle of role-to-user assignments in a multi-tenant context. A user can hold different roles in different restaurants, providing flexible access control across organizational boundaries.

## Assignment Lifecycle

```
                ┌──────────────┐
                │   Pending    │
                └──────┬───────┘
                       │
                ┌──────▼───────┐
         ┌──────│    Active    │──────┐
         │      └──────────────┘      │
         │                            │
         ▼                            ▼
  ┌──────────────┐            ┌──────────────┐
  │   Expired    │            │   Revoked    │
  └──────────────┘            └──────────────┘
         │
         │ (reactivate)
         ▼
  ┌──────────────┐
  │    Active    │
  └──────────────┘
```

### States

| Status   | Description                                      |
|----------|--------------------------------------------------|
| `active`  | Role is actively assigned; permissions are granted |
| `expired` | Assignment passed its `expiresAt` date            |
| `revoked` | Manually removed by an administrator              |

### Transitions

- `active` → `expired`: Automatic (via scheduled job checking `expiresAt`)
- `active` → `revoked`: Manual (administrator removes role)
- `expired` → `active`: Manual (administrator reactivates)
- `revoked` is terminal; a new assignment must be created

## Data Model

### UserRole Entity

| Field          | Type       | Description                                     |
|----------------|------------|-------------------------------------------------|
| `id`           | UUID       | Primary key                                     |
| `userId`       | UUID       | Reference to the assigned user                  |
| `roleId`       | UUID       | Reference to the assigned role                  |
| `restaurantId` | UUID       | Denormalized restaurant context for fast queries |
| `branchId`     | UUID (nullable) | Optional branch-level scope                |
| `assignedBy`   | UUID       | User who created the assignment                 |
| `assignedAt`   | DateTime   | When the assignment was created                 |
| `expiresAt`    | DateTime (nullable) | Optional expiration date                |
| `status`       | Enum       | `active`, `expired`, `revoked`                  |
| `createdAt`    | DateTime   | Record creation timestamp                       |
| `updatedAt`    | DateTime   | Record last update timestamp                    |

### Unique Constraints

- `@@unique([userId, roleId, restaurantId])` — A user can only hold a given role once per restaurant.

## Business Rules

### Validation Rules

1. **Duplicate Prevention**: Cannot create an active assignment if one already exists for the same (user, role, restaurant) combination.
2. **Inactive Roles**: Cannot assign a role whose `status` is not `active`.
3. **Cross-Tenant**: A role can only be assigned within its owning restaurant.
4. **System Roles**: System roles (`isSystem=true`) require platform-level elevation to assign or remove.
5. **Restaurant Context**: The target user must belong to the target restaurant.
6. **Revoked Terminal**: Revoked assignments cannot be modified; a new assignment must be created.

### Assignment Policy

| Operation               | Required Role                             |
|-------------------------|-------------------------------------------|
| Assign restaurant role  | `restaurant-owner`, `restaurant-manager`  |
| Assign system role      | `super-admin`, `platform-admin`           |
| Remove restaurant role  | `restaurant-owner`, `restaurant-manager`  |
| Remove system role      | `super-admin`, `platform-admin`           |
| Replace user roles      | `restaurant-owner`, `restaurant-manager`  |

## Multi-Tenant Behavior

A user may belong to multiple restaurants (organizations) and hold different roles in each:

**Example:**
```
John Doe
├── Restaurant A → Manager  (role: manager)
└── Restaurant B → Waiter   (role: waiter)
```

When authenticating, the JWT carries the user's `organizationId` which determines the active restaurant context. The `AuthorizationContext` built by `enrichContext` middleware resolves the user's roles and permissions within that context.

### Cross-Restaurant Isolation

- Assignments are always scoped to a `restaurantId`.
- Queries filter by `restaurantId` to prevent data leakage.
- Role ownership is validated against the restaurant context.

## Service API

### RoleAssignmentService

```typescript
interface RoleAssignmentService {
  assignRole(
    userId: string,
    roleId: string,
    restaurantId: string,
    assignedBy: string,
    options?: { branchId?: string | null; expiresAt?: Date | null }
  ): Promise<RoleAssignmentResult>;

  removeRole(
    userId: string,
    roleId: string,
    restaurantId: string,
    performedBy: string
  ): Promise<void>;

  replaceUserRoles(
    userId: string,
    restaurantId: string,
    roleIds: string[],
    assignedBy: string,
    options?: { branchId?: string | null; expiresAt?: Date | null }
  ): Promise<ReplaceRolesResult>;

  getUserRoles(
    userId: string,
    restaurantId?: string
  ): Promise<UserRole[]>;

  getUsersInRole(
    roleId: string,
    restaurantId?: string
  ): Promise<UserRole[]>;

  getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]>;

  updateAssignmentStatus(
    assignmentId: string,
    status: UserRoleStatus,
    performedBy: string
  ): Promise<UserRole>;

  updateAssignmentExpiry(
    assignmentId: string,
    expiresAt: Date | null,
    performedBy: string
  ): Promise<UserRole>;

  validateAssignment(
    userId: string,
    roleId: string,
    restaurantId: string
  ): Promise<{ valid: boolean; errors: string[] }>;
}
```

### Usage Examples

**Assign a role:**
```typescript
const result = await roleAssignmentService.assignRole(
  "user-abc",
  "role-xyz",
  "restaurant-123",
  "admin-456",
  { branchId: "branch-789" }
);
// result.assignment.status === "active"
```

**Replace all roles for a user:**
```typescript
const result = await roleAssignmentService.replaceUserRoles(
  "user-abc",
  "restaurant-123",
  ["role-waiter", "role-cashier"],
  "admin-456"
);
// result.removed (previous roles revoked)
// result.assigned (new roles created)
```

**List users in a restaurant with their roles:**
```typescript
const users = await roleAssignmentService.getRestaurantUsers("restaurant-123");
// users[0].userId, users[0].assignments[]
```

## Error Reference

| Error                          | HTTP | Code                           | Description                             |
|--------------------------------|------|--------------------------------|-----------------------------------------|
| `UserNotFoundError`            | 404  | `authz.user.not_found`         | Target user does not exist              |
| `RoleNotFoundError`            | 404  | `authz.role.not_found`         | Target role does not exist              |
| `AssignmentNotFoundError`      | 404  | `authz.assignment.not_found`   | Role assignment not found               |
| `DuplicateAssignmentError`     | 409  | `authz.assignment.duplicate`   | Active assignment already exists        |
| `InvalidRoleAssignmentError`   | 400  | `authz.assignment.invalid`     | Assignment violates business rules      |

## Architecture

The implementation follows Clean Architecture / DDD:

```
┌─────────────────────────────────────────────────┐
│                  Application                     │
│  RoleAssignmentServiceImpl                      │
│  RoleAssignmentPolicy                           │
├─────────────────────────────────────────────────┤
│                   Domain                         │
│  UserRole (model)                               │
│  UserRoleRepository (interface)                 │
│  UserRoleValidation (pure functions)            │
├─────────────────────────────────────────────────┤
│               Infrastructure                     │
│  UserRoleRepositoryImpl (Prisma)                │
└─────────────────────────────────────────────────┘
```

### Dependencies

- `RoleAssignmentServiceImpl` depends on `UserRoleRepository` and `RoleRepository`
- `RoleAssignmentPolicy` is stateless and can be used standalone
- Validation functions are pure and independently testable
