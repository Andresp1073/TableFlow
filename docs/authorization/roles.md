# Enterprise Role Model

## Role Philosophy

TableFlow employs a **two-tier role model** separating platform-wide concerns from restaurant-specific operations. This design follows enterprise RBAC best practices for multi-tenant SaaS platforms, ensuring clear separation of duties and tenant isolation.

### Design Principles

1. **Principle of Least Privilege** — Each role grants only the permissions necessary for its function.
2. **Tenant Isolation** — Restaurant roles are scoped to a single organization; system roles span all tenants.
3. **Extensibility** — The model supports restaurant-specific role customization without modifying system roles.
4. **Safety** — System roles are protected from deletion; default roles prevent accidental configuration gaps.

## Role Hierarchy

```
Platform Level
├── Super Admin         (unrestricted platform access)
├── Platform Admin      (operational platform management)
└── Support             (read-only cross-tenant support)

Restaurant Level
├── Restaurant Owner     (full restaurant ownership)
├── Restaurant Manager   (operational management)
├── Host                 (front-of-house guest management)
├── Waiter               (floor service)
├── Cashier              (payment processing)
├── Chef                 (kitchen leadership)
├── Kitchen Staff        (kitchen operations)
├── Receptionist         (reservation management)
└── Viewer               (read-only operational access)

Special
└── Customer             (self-service diner account)
```

## System vs Restaurant Roles

| Attribute | System Roles | Restaurant Roles |
|-----------|-------------|-----------------|
| `restaurantId` | `NULL` | Organization UUID |
| `isSystem` | `true` | `false` |
| `isDefault` | `false` | `true` |
| Deletable | No | Yes |
| Created | Seed / Migration | Provisioning or Admin UI |

### System Roles

System roles are platform-wide and have `restaurantId = NULL`. They cannot be deleted or modified by tenant administrators.

| Code | Name | Priority | Purpose |
|------|------|----------|---------|
| `super-admin` | Super Admin | 1000 | Unrestricted platform access |
| `platform-admin` | Platform Admin | 900 | Operational platform management |
| `support` | Support | 800 | Read-only cross-tenant support |

### Restaurant Default Roles

These roles are created as templates during platform seeding. When a new restaurant is provisioned, each default role is instantiated with the restaurant's `organizationId`.

| Code | Name | Priority | Function |
|------|------|----------|----------|
| `restaurant-owner` | Restaurant Owner | 700 | Full restaurant ownership |
| `restaurant-manager` | Restaurant Manager | 600 | Operational management |
| `host` | Host | 500 | Guest greeting and seating |
| `waiter` | Waiter | 400 | Floor service |
| `cashier` | Cashier | 350 | Payment processing |
| `chef` | Chef | 300 | Kitchen leadership |
| `kitchen-staff` | Kitchen Staff | 200 | Kitchen operations |
| `receptionist` | Receptionist | 250 | Reservation management |
| `viewer` | Viewer | 100 | Read-only access |

### Special Roles

| Code | Name | Purpose |
|------|------|---------|
| `customer` | Customer | Self-service diner account |

## Role Model Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `code` | String | Unique identifier within scope (`@@unique([code, restaurantId])`) |
| `name` | String | Human-readable display name |
| `description` | Text | Detailed description of the role |
| `restaurantId` | UUID (nullable) | Organization this role belongs to (NULL for system roles) |
| `isSystem` | Boolean | Whether this is a protected platform role |
| `isDefault` | Boolean | Whether this is a default template role |
| `priority` | Integer | Sort order (0-10000, higher = more privileged) |
| `color` | String (hex) | UI display color |
| `icon` | String | UI icon identifier |
| `status` | Enum | `active`, `inactive`, `archived` |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

## Validation Rules

- `code` must start with a lowercase letter; contain only lowercase letters, numbers, and hyphens
- `code` must not exceed 100 characters
- `name` must not exceed 100 characters
- `priority` must be an integer between 0 and 10000
- `color` must be a valid 6-digit hex color (e.g. `#DC2626`)
- `status` must be `active`, `inactive`, or `archived`
- System roles (`super-admin`, `platform-admin`, `support`) cannot be deleted
- Default role codes must be unique
- Role codes must be unique within a single restaurant

## Future Customization Strategy

Restaurant-specific role customization will follow this pattern:

1. **Inheritance** — New restaurant roles are created by copying a default template with the restaurant's `organizationId`.
2. **Customization** — Administrators can modify name, description, color, icon, and permission assignments on their restaurant's copy.
3. **Protection** — System roles remain immutable at the tenant level.
4. **Resets** — Resetting a customized role to defaults re-applies the template's permission set.
5. **Archival** — Unused roles can be archived (status = `archived`) rather than deleted to preserve audit history.
