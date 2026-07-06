# Authorization Model

## Overview

TableFlow implements **Role-Based Access Control (RBAC)** as its authorization model. RBAC was chosen over other models (ABAC, ReBAC, ACL) for its balance of simplicity, maintainability, and suitability for a SaaS platform with well-defined job functions.

---

## Why RBAC

| Model | Consideration | Decision |
|-------|--------------|----------|
| **RBAC** | Roles map directly to restaurant job functions. Easy to understand and audit. | **Selected** |
| **ABAC (Attribute-Based)** | More flexible but adds complexity. Restaurant access rules are not attribute-dynamic enough to justify it. | Rejected for now — may be layered on top in future phases. |
| **ReBAC (Relationship-Based)** | Suitable for social graphs. Overengineered for restaurant hierarchies. | Rejected |
| **ACL (Access Control Lists)** | Hard to maintain at scale. Each resource would need individual entries. | Rejected |

---

## RBAC Model Architecture

```
                    ┌─────────────────┐
                    │    User         │
                    └────────┬────────┘
                             │ assigned to
                             ▼
                    ┌─────────────────┐
                    │     Role        │
                    ├─────────────────┤
                    │  Scope:         │
                    │  - Global       │
                    │  - Organization │
                    │  - Branch       │
                    └────────┬────────┘
                             │ contains
                             ▼
                    ┌─────────────────┐
                    │   Permission    │
                    ├─────────────────┤
                    │  Format:        │
                    │  resource.action│
                    └─────────────────┘
```

### Core Entities

| Entity | Description |
|--------|-------------|
| **User** | An authenticated person who interacts with the system. |
| **Role** | A named collection of permissions. Roles have a scope (global, organization, or branch). |
| **Permission** | A discrete action that can be performed on a resource (e.g., `reservations.create`). |
| **Scope** | The boundary within which a role's permissions apply: `global`, `organization`, or `branch`. |

---

## Permission Inheritance

Permissions are **additive** — a role grants permissions and never denies them. Denial is implicit: if a permission is not granted, the action is denied.

### Inheritance Rules

1. **Role hierarchy inheritance**: A role inherits permissions from all roles below it in the hierarchy:
   - `System Administrator` inherits all permissions from all roles.
   - `Restaurant Administrator` inherits from `Restaurant Manager`, `Receptionist`, and `Waiter`.
   - `Restaurant Manager` inherits from `Receptionist` and `Waiter`.
   - `Receptionist` does not inherit from `Waiter` (different responsibilities).

2. **Scope-based visibility**: A role's scope determines which records it can access:
   - `branch` scope: can only access resources belonging to the assigned branch.
   - `organization` scope: can access resources across all branches of the organization.
   - `global` scope: can access resources across all organizations.

3. **No negative permissions**: There is no deny or blacklist mechanism. Restrictions are enforced by the absence of a permission.

---

## Authentication Flow

```
┌─────────┐       ┌───────────┐       ┌──────────┐       ┌──────────┐
│ Client  │ ────► │  Auth     │ ────► │  Token   │ ────► │  API     │
│         │       │  Service  │       │  Validate│       │  Gateway │
└─────────┘       └───────────┘       └──────────┘       └──────────┘
                                                               │
                                                               ▼
                                                       ┌──────────────┐
                                                       │  Permission  │
                                                       │  Check       │
                                                       └──────┬───────┘
                                                              │
                                                     ┌────────▼────────┐
                                                     │  Allow / Deny   │
                                                     └─────────────────┘
```

### Step-by-Step

1. **Client** sends login request with credentials.
2. **Auth Service** validates credentials against the database.
3. Upon success, Auth Service generates a JWT access token containing:
   - `sub` (user ID)
   - `role` (assigned role ID)
   - `scope` (branch ID or organization ID or `*`)
   - `iat` (issued at)
   - `exp` (expiration — 15 minutes)
4. A **refresh token** is also issued (7-day expiration) and stored securely.
5. **Client** includes the access token in the `Authorization: Bearer <token>` header for subsequent requests.
6. **API Gateway** validates the token signature and expiration.
7. **Permission Check** middleware extracts the role from the token and verifies that the role includes the required permission for the requested endpoint.
8. If authorized, the request proceeds. Otherwise, a `403 Forbidden` response is returned.
9. When the access token expires, the client uses the refresh token to obtain a new pair.

---

## Authorization Flow (Request-Level)

```
Incoming Request
│
├── 1. Extract JWT from Authorization header
│
├── 2. Validate JWT (signature, expiration, issuer)
│     └── Invalid → 401 Unauthorized
│
├── 3. Extract user, role, and scope from token
│
├── 4. Resolve required permission for the endpoint
│     └── (mapped via decorator/annotation: @RequirePermission('reservations.create'))
│
├── 5. Check if role's scope covers the target resource
│     └── (e.g., branch-scoped role cannot access another branch's data)
│
├── 6. Check if role includes the required permission
│     └── (lookup in role-permissions mapping, including inherited permissions)
│
├── 7. Decision:
│     ├── Permission granted → 200/201/204 response
│     └── Permission denied → 403 Forbidden
│
└── 8. Log the authorization decision to audit log
```

---

## Scope Enforcement

Scope enforcement ensures that a user can only access resources within their authorized boundary.

| Role | Typical Scope | Can Access |
|------|--------------|------------|
| Waiter | `branch:{id}` | Tables and reservations in assigned branch section |
| Receptionist | `branch:{id}` | All reservations and tables in assigned branch |
| Restaurant Manager | `branch:{id}` | Branch-level data and operational reports |
| Restaurant Administrator | `organization:{id}` | All branches under the organization |
| Support | `organization:{id}` (read) | Read access to assigned organizations |
| System Administrator | `global:*` | All organizations and all data |

### Scope Validation Logic

```
function isAuthorized(user, requiredPermission, targetResource):
    // 1. Check if user's role has the required permission
    if not roleHasPermission(user.role, requiredPermission):
        return false

    // 2. Check scope
    if user.scope == 'global':
        return true  // System Admin

    if user.scope == 'organization:{orgId}':
        return targetResource.organizationId == orgId

    if user.scope == 'branch:{branchId}':
        return targetResource.branchId == branchId

    return false
```

---

## Security Recommendations

### Token Security

| Recommendation | Rationale |
|---------------|-----------|
| Use short-lived access tokens (15 minutes) | Limits damage if a token is compromised. |
| Implement refresh token rotation | Each refresh token use issues a new one and invalidates the old one. |
| Store refresh tokens in HTTP-only, Secure, SameSite cookies | Prevents XSS token theft. |
| Use RS256 or ES256 for JWT signing | Asymmetric signing allows services to verify without sharing the private key. |
| Include a `jti` (JWT ID) claim for token revocation | Enables individual token invalidation. |

### Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 12 characters |
| Character types | Uppercase, lowercase, number, special character |
| Maximum failed attempts | 5 before lockout |
| Lockout duration | 30 minutes or admin unlock |
| Password history | 5 previous passwords remembered |
| Maximum password age | 90 days |

### API Security

| Measure | Implementation |
|---------|----------------|
| Rate limiting | 10 req/min on auth endpoints, 100 req/min on general API |
| CORS | Whitelist specific origins only |
| HTTPS | Enforce TLS 1.3 on all connections |
| Input validation | Zod schemas on every endpoint |
| SQL injection | Prisma parameterized queries |
| XSS | Output encoding, Content-Security-Policy headers |
| CSRF | Double-submit cookie pattern or SameSite=Strict |

### Audit Requirements

- All authorization decisions (granted and denied) must be logged.
- All role and permission changes must be logged with before/after values.
- All user creation, role assignment, and account status changes must be logged.
- Audit logs are immutable and append-only.

---

## Permission Validation Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Decorator Layer                     │
│  @RequirePermission('reservations.create')          │
│  @RequireScope('branch')                            │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Permission Guard Middleware             │
│  1. Extract token                                   │
│  2. Extract required permission from route metadata │
│  3. Query role-permissions cache                    │
│  4. Validate scope                                  │
│  5. Allow / Deny                                    │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               Role-Permissions Cache                 │
│  In-memory cache (Redis) keyed by role ID           │
│  Invalidated on role/permission changes             │
│  TTL: 1 hour                                        │
└─────────────────────────────────────────────────────┘
```

### Performance Considerations

- Role-permission mappings are cached to avoid database lookups on every request.
- Cache is invalidated whenever a role definition or permission assignment changes.
- Token validation is stateless (JWT) to allow horizontal scaling.
- Scope checks use the resource's organization/branch ID extracted from the request path or payload.

---

## Future Scalability

### Planned Extensions

| Feature | Description | When |
|---------|-------------|------|
| **Fine-grained ABAC** | Add attribute-based rules on top of RBAC (e.g., "can modify reservations only if created today"). | Phase 6+ |
| **Resource-level permissions** | Allow granting permissions on specific resources (e.g., "can manage Table 12 only"). | Phase 6+ |
| **Temporary roles** | Grant elevated permissions for a limited time window. | Phase 6+ |
| **API tokens** | Machine-to-machine tokens with scoped permissions for integrations. | Phase 6+ |
| **Self-service role management** | Allow Restaurant Admins to create custom roles via UI. | Phase 5 |
| **Permission audit reports** | Generate reports showing which users have which permissions. | Phase 7 |

### RBAC Limitations and Mitigations

| Limitation | Mitigation |
|------------|------------|
| Role explosion with many unique permission combinations | Use role templates and encourage standardization. Custom roles are available for exceptions. |
| Coarse-grained (all-or-nothing per resource) | Supplement with scope-based restrictions and future ABAC layer. |
| Hard to model context-dependent rules | Context rules (e.g., time-based) can be added as middleware without changing the RBAC core. |
