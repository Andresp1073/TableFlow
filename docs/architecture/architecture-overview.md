# Architecture Overview

**Last updated:** 2026-07-04

## General Architecture

TableFlow follows a **Modular Monolith with Clean Architecture boundaries** — a design that combines the deployment simplicity of a monolith with the discipline of Clean Architecture. The system is divided into feature modules with strict dependency rules, internal layers, and well-defined interfaces.

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Auth    │ │Reservtn │ │  Tables  │ │Customers │   │
│  │  Module  │ │ Module  │ │  Module  │ │  Module  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                    │  TanStack Query / Axios              │
└────────────────────┼─────────────────────────────────────┘
                     │ HTTP (REST JSON)
                     ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend (Express API)                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              API Gateway Layer                      │  │
│  │  Routes → Middleware (Auth, RBAC, RateLimit, Log)  │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Application Layer                      │  │
│  │  Controllers → Validators → DTOs                   │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Domain Layer                           │  │
│  │  Services → Domain Logic → Business Rules          │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Infrastructure Layer                   │  │
│  │  Repositories → Prisma ORM → MySQL                │  │
│  │  Email Service → SMTP                              │  │
│  │  Cache → Redis (future)                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Auth    │ │Reservtn │ │  Tables  │ │Customers │   │
│  │  Module  │ │ Module  │ │  Module  │ │  Module  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## High-Level Overview

| Aspect | Decision |
|--------|----------|
| **Architecture Style** | Modular Monolith with Clean Architecture layers |
| **Deployment** | Single deployable unit (Docker container) |
| **API** | RESTful JSON over HTTPS |
| **Frontend** | Single-page application, separate container |
| **Database** | Single MySQL instance with future read replicas |
| **Authentication** | Stateless JWT with refresh token rotation |
| **Documentation** | Swagger/OpenAPI 3.0 |

---

## Architectural Goals

| Goal | Description |
|------|-------------|
| **Maintainability** | Modules can be understood, changed, and tested independently. |
| **Testability** | Domain logic is framework-agnostic and fully testable without HTTP or database. |
| **Scalability** | Stateless API layer can scale horizontally. Database can add read replicas. |
| **Security** | Defense in depth: network, transport, application, data layers. |
| **Developer Experience** | Fast feedback loops, clear conventions, minimal configuration overhead. |
| **Future-readiness** | Modules can be extracted into microservices without rewriting. |

---

## Quality Attributes

| Attribute | Target | Strategy |
|-----------|--------|----------|
| **Availability** | 99.9% uptime | Stateless API, health checks, Docker restart policies |
| **Performance (API)** | 95th percentile < 200ms | Caching, indexed queries, lazy loading |
| **Performance (UI)** | Lighthouse > 90 | Code splitting, lazy routes, CDN assets |
| **Scalability** | 10,000 concurrent users | Horizontal API scaling, read replicas |
| **Maintainability** | Cyclomatic complexity < 10 | Enforced via ESLint, code review |
| **Security** | OWASP Top 10 compliant | Validation, sanitization, rate limiting, audit |
| **Test Coverage** | > 80% lines | Unit + integration + E2E pyramid |
| **Accessibility** | WCAG 2.1 AA | Automated audits, manual checks |

---

## System Layers

### Frontend Layers

```
Pages → Features → Shared Components → UI Primitives
   ↓          ↓            ↓                 ↓
Hooks → Services (Axios) → TanStack Query → API
   ↓
Zod Validation
```

| Layer | Responsibility |
|-------|---------------|
| **Pages** | Route entry points. Compose features and layouts. |
| **Features** | Self-contained feature modules (reservations, tables, etc.). |
| **Shared Components** | Reusable UI components (DataTable, Modal, Card). |
| **UI Primitives** | Atomic components (Button, Input, Badge). |
| **Hooks** | React hooks for state, data fetching, and side effects. |
| **Services** | Axios instance configured with interceptors for auth and error handling. |
| **TanStack Query** | Server state caching, synchronization, loading states. |
| **Zod** | Schema validation for forms and API responses. |

### Backend Layers

```
Routes → Middleware → Controller → Validator (Zod) → DTO
                                                    ↓
                                             Service (Business Logic)
                                                    ↓
                                            Repository (Data Access)
                                                    ↓
                                              Prisma → MySQL
```

| Layer | Responsibility |
|-------|---------------|
| **Routes** | HTTP method + path → middleware chain → controller. |
| **Middleware** | Cross-cutting concerns: auth, RBAC, rate limit, logging, error handling. |
| **Controller** | Extract HTTP params, delegate to service, format response. |
| **Validator** | Zod schema validation for request body, params, and query. |
| **DTO** | Data Transfer Objects for input/output contracts. |
| **Service** | Pure business logic, no HTTP or database awareness. |
| **Repository** | Data access abstraction over Prisma. |
| **Prisma** | ORM client — type-safe database access. |
| **MySQL** | Relational database. |

---

## Module Boundaries

Every feature module follows the same internal structure:

```
modules/{feature}/
├── {feature}.controller.ts
├── {feature}.service.ts
├── {feature}.repository.ts
├── {feature}.routes.ts
├── {feature}.validator.ts
├── {feature}.dto.ts
├── {feature}.types.ts
├── {feature}.interfaces.ts
├── index.ts
└── __tests__/
```

Cross-module communication happens **only through the Service layer** — never through repositories directly. See [dependency-rules.md](./dependency-rules.md) for strict dependency rules.

---

## Request Lifecycle

A complete request lifecycle is described in [request-lifecycle.md](./request-lifecycle.md).

---

## Related Documents

| Document | Description |
|----------|-------------|
| [architecture-style.md](./architecture-style.md) | Comparison and justification of architectural style |
| [frontend-architecture.md](./frontend-architecture.md) | Detailed frontend design |
| [backend-architecture.md](./backend-architecture.md) | Detailed backend design |
| [module-architecture.md](./module-architecture.md) | Per-module architecture breakdown |
| [design-patterns.md](./design-patterns.md) | Patterns used across the system |
| [dependency-rules.md](./dependency-rules.md) | Strict dependency rules |
| [request-lifecycle.md](./request-lifecycle.md) | End-to-end request flow |
