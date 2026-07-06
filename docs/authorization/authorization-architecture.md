# Authorization Architecture

## Module Responsibilities

The authorization module provides the domain foundation for Role-Based Access Control (RBAC) across the TableFlow multi-tenant SaaS platform. It defines interfaces and contracts — not implementations — separating authorization policy from enforcement.

| Layer | Responsibility |
|---|---|
| **Domain** | Pure business concepts: Role, Permission, AuthorizationContext, evaluation contracts |
| **Application** | Use-case orchestration: authorization checks, role assignment workflows |
| **Infrastructure** (future) | Prisma persistence, Redis caching, middleware integration |
| **Presentation** (future) | HTTP endpoints for role/permission management |

## Folder Organization

```
modules/authorization/
├── domain/
│   ├── models/
│   │   ├── Role.ts                    — Role entity interface
│   │   ├── Permission.ts              — Permission entity interface
│   │   ├── UserRole.ts                — User-Role assignment interface
│   │   ├── AuthorizationContext.ts    — Context passed to all permission checks
│   │   └── index.ts
│   ├── repositories/
│   │   ├── RoleRepository.ts          — Role data access contract
│   │   ├── PermissionRepository.ts    — Permission data access contract
│   │   └── index.ts
│   └── services/
│       ├── PermissionEvaluator.ts     — Evaluates if a context has a permission
│       ├── PermissionResolver.ts      — Maps resource+action to permission names
│       └── index.ts
├── application/
│   └── services/
│       ├── AuthorizationService.ts    — Core auth orchestrator
│       ├── RoleAssignmentService.ts   — Role assignment lifecycle
│       └── index.ts
├── errors/
│   ├── RoleNotFoundError.ts
│   ├── PermissionDeniedError.ts
│   ├── PermissionNotFoundError.ts
│   ├── InvalidRoleAssignmentError.ts
│   ├── UnauthorizedRestaurantAccessError.ts
│   └── index.ts
└── index.ts                           — Barrel exports
```

## Dependency Flow

```
Presentation (future)
    │
    ▼
Application Services
    │
    ▼
Domain Services (interfaces)
    │
    ▼
Domain Repositories (interfaces)
    │
    ▼
Infrastructure (future — Prisma, Redis)
```

- **Domain** never depends on Application or Infrastructure.
- **Application** depends on Domain (interfaces).
- **Infrastructure** implements Domain interfaces.
- **Presentation** depends on Application only.

## Multi-Tenant Strategy

### Tenant Hierarchy

```
Platform (global)
  └── Restaurant (organization)
        └── Branch (physical location)
              └── Role
                    └── Permission
                          └── User
```

### Scope Model

Authorization is scoped at three levels:

| Scope | Description | Example Roles |
|---|---|---|
| `global` | Across all organizations | System Administrator |
| `organization` | Within one restaurant | Restaurant Administrator |
| `branch` | Within one physical location | Waiter, Receptionist, Manager |

### Multi-Restaurant Users

A user may hold different roles in different restaurants. When a user authenticates, their active organization context determines which role and permissions apply. The `AuthorizationContext` carries the resolved scope for the current request.

## RBAC Philosophy

### Additive Permissions

Permissions are strictly additive — a role grants permissions and never denies them. Denial is implicit: absence of a required permission results in denial.

### No Role Hierarchy

Roles do not inherit from other roles. If two roles share permissions, both are assigned the same permission directly. This avoids the complexity and fragility of role inheritance chains. Permission sets are composed at assignment time, not at role-definition time.

### Context-Based Evaluation

Every authorization decision receives an `AuthorizationContext` containing:
- The authenticated user's identity
- The active organization
- The resolved role and its permissions
- The scope boundary for the current request

The evaluator checks both the permission and the scope before granting access.

### Separation of Policy from Enforcement

- **Policy** is defined in domain service interfaces (`PermissionEvaluator`, `AuthorizationService`).
- **Enforcement** is handled by middleware (future) that extracts the context from the JWT, delegates to services, and returns 403 on denial.

## Database Entities

The existing Prisma schema already models the RBAC foundation:

| Model | Purpose |
|---|---|
| `Role` | Named role with system flag |
| `Permission` | Granular action identified by dot-notation name |
| `RolePermission` | Junction: which permissions a role includes |
| `UserRole` | Assignment: which user has which role (optionally scoped to branch) |

No schema changes are required for the authorization foundation. The domain interfaces map directly to these existing models.

## Error Model

| Error | HTTP | Code | When |
|---|---|---|---|
| `RoleNotFoundError` | 404 | `authz.role.not_found` | Requested role does not exist |
| `PermissionNotFoundError` | 404 | `authz.permission.not_found` | Requested permission does not exist |
| `PermissionDeniedError` | 403 | `authz.permission.denied` | User lacks required permission |
| `InvalidRoleAssignmentError` | 400 | `authz.assignment.invalid` | Role assignment violates business rules |
| `UnauthorizedRestaurantAccessError` | 403 | `authz.restaurant.access_denied` | User's scope does not cover target restaurant |

All errors extend `AppError` from `src/errors/AppError.ts` and follow the existing error response format.

## Interfaces Summary

### Domain Repositories

| Interface | Key Methods |
|---|---|
| `RoleRepository` | `findById`, `findByName`, `findAll`, `findSystemRoles`, `findRolesByUser` |
| `PermissionRepository` | `findById`, `findByName`, `findAll`, `findByModule`, `findPermissionsByRole`, `findPermissionsByUser` |

### Domain Services

| Interface | Key Methods |
|---|---|
| `PermissionEvaluator` | `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `evaluateScope` |
| `PermissionResolver` | `resolve`, `getResourceTypes`, `getActions` |

### Application Services

| Interface | Key Methods |
|---|---|
| `AuthorizationService` | `authorize`, `authorizeScoped`, `createContext`, `getPermissions` |
| `RoleAssignmentService` | `assignRole`, `removeRole`, `getUserRoles`, `getUsersInRole`, `updateRoleAssignment` |

## Future Extensions

- **ABAC layer**: Attribute-based rules on top of RBAC for fine-grained conditions
- **Resource-level permissions**: Grant access to specific resources (e.g., Table 12)
- **Temporary roles**: Time-bound elevated permissions
- **API tokens**: Machine-to-machine auth with scoped permissions
- **Permission audit**: Reports showing effective permissions per user
