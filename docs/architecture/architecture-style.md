# Architecture Style

**Last updated:** 2026-07-04

## Comparison of Architectural Styles

### 1. Layered Architecture (N-Tier)

| Aspect | Assessment |
|--------|------------|
| **Structure** | Presentation → Business → Persistence → Database |
| **Complexity** | Low |
| **Learning Curve** | Minimal |
| **Testability** | Low — layers are tightly coupled |
| **Scalability** | Low — monolith deployment |
| **Maintainability** | Low — changes in one layer often leak across layers |
| **Best For** | Simple CRUD apps, prototypes |

**Disadvantages:** Leads to "big ball of mud" as the project grows. Layers are not truly isolated — business logic leaks into controllers and vice versa.

---

### 2. Clean Architecture (Robert C. Martin)

| Aspect | Assessment |
|--------|------------|
| **Structure** | Enterprise → Application → Interface Adapters → Frameworks |
| **Complexity** | High |
| **Learning Curve** | Steep |
| **Testability** | Excellent — domain has zero external dependencies |
| **Scalability** | High — dependency rules enforce isolation |
| **Maintainability** | High — business rules are framework-agnostic |
| **Best For** | Complex enterprise applications with long lifespan |

**Disadvantages:** Significant boilerplate. Can feel overengineered for simple CRUD operations. Requires discipline to maintain dependency direction.

---

### 3. Modular Monolith

| Aspect | Assessment |
|--------|------------|
| **Structure** | Single deployable unit with module boundaries |
| **Complexity** | Medium |
| **Learning Curve** | Moderate |
| **Testability** | High — modules can be tested independently |
| **Scalability** | Medium — scales horizontally as a single unit |
| **Maintainability** | High — module boundaries prevent leakage |
| **Best For** | Projects that may transition to microservices later |

**Disadvantages:** Modules are not independently deployable. Shared state can create coupling. Requires strict enforcement of module boundaries.

---

### 4. Hexagonal Architecture (Ports & Adapters)

| Aspect | Assessment |
|--------|------------|
| **Structure** | Core domain surrounded by ports and adapters |
| **Complexity** | High |
| **Learning Curve** | Steep |
| **Testability** | Excellent — core is fully isolated |
| **Scalability** | High |
| **Maintainability** | High |
| **Best For** | Systems with many external integrations |

**Disadvantages:** Higher abstraction overhead. More interfaces and indirection. Can slow down early development velocity.

---

### 5. Vertical Slice Architecture

| Aspect | Assessment |
|--------|------------|
| **Structure** | Features are vertical slices through all layers |
| **Complexity** | Medium |
| **Learning Curve** | Moderate |
| **Testability** | High — each slice is self-contained |
| **Scalability** | Medium |
| **Maintainability** | High — changes in one slice rarely affect others |
| **Best For** | CRUD-heavy applications with clear feature boundaries |

**Disadvantages:** Can lead to code duplication across slices. Less guidance on shared domain logic.

---

## Recommendation: Modular Monolith + Clean Architecture Boundaries

**Recommended architecture:** A **Modular Monolith** with **Clean Architecture** internal layering.

### Rationale

| Factor | Why this combination fits TableFlow |
|--------|--------------------------------------|
| **Current scale** | TableFlow starts as a single-team product. A monolith avoids the operational overhead of microservices (distributed transactions, service discovery, inter-service communication). |
| **Future extraction** | Clean Architecture boundaries ensure that if a module (e.g., Notifications) needs to become a microservice, it can be extracted without rewriting — its domain logic is already isolated. |
| **Team size** | A small to medium team can develop, test, and deploy a modular monolith faster than a distributed system. |
| **Deployment simplicity** | One Docker container for the API, one for the frontend. Simple CI/CD. No orchestration needed. |
| **Module isolation** | Module boundaries prevent code from leaking across features. This is the primary problem that Layered Architecture fails to solve. |
| **Testability** | Domain logic can be unit tested without HTTP, database, or framework dependencies — just like Clean Architecture. |

### The Hybrid Approach

```
┌──────────────────────────────────────────────────────────┐
│                   Module A (e.g., Reservations)           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Controller (HTTP adapter)                         │  │
│  │  Service (domain logic — no imports from B)        │  │
│  │  Repository (Prisma adapter)                       │  │
│  └────────────────────────────────────────────────────┘  │
│  Inter-module communication through Service interfaces   │
├──────────────────────────────────────────────────────────┤
│                   Module B (e.g., Notifications)          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Controller                                        │  │
│  │  Service                                           │  │
│  │  Repository                                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Modules communicate through **service interfaces** (not direct repository access).
- A module exposes a public interface; other modules depend on the interface, not the implementation.
- The `common/` module contains shared domain logic that multiple modules need.

### When This Would Change

If TableFlow reaches the scale where:
- Different modules need different scaling policies (e.g., Notifications needs 10x the compute of Reservations).
- Different teams need independent deployment schedules.
- The monolith build exceeds 15 minutes.

...then modules can be extracted into microservices one at a time, starting with Notifications or Reports.

---

## Architectural Decision Record

See [architecture-decisions.md](./architecture-decisions.md) for the full decision log.

| Decision | ADR |
|----------|-----|
| Modular Monolith + Clean Architecture | ADR-001 |
| REST over GraphQL | ADR-002 |
| Single database instance initially | ADR-003 |

---

## Related Documents

- [architecture-overview.md](./architecture-overview.md) — High-level system view
- [dependency-rules.md](./dependency-rules.md) — Layer and module dependency rules
