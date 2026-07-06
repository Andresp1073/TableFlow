# Architecture Decisions

**Last updated:** 2026-07-04

## Purpose

This document records all significant architectural decisions made during Phase 3. Each decision includes context, options considered, the chosen approach, consequences, and a recommendation.

---

## Decision Template

```markdown
## ADR-{ID}: {Title}

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded
**Author:** {Name}

### Context
What problem does this decision address?

### Options Considered
| Option | Description |
|--------|-------------|
| A | ... |
| B | ... |

### Decision
What was chosen and why.

### Consequences
Trade-offs, impacts, and follow-up work.

### Recommendation
For or against, with rationale.
```

---

## ADR-001: Modular Monolith with Clean Architecture Boundaries

**Date:** 2026-07-04
**Status:** Accepted

### Context

TableFlow needs an architecture that balances development velocity (small team, single deployable unit) with long-term maintainability (15-year lifespan, potential team growth, potential microservice extraction).

### Options Considered

| Option | Complexity | Maintainability | Scalability |
|--------|------------|-----------------|-------------|
| Layered Architecture | Low | Low | Low |
| Pure Clean Architecture | High | High | High |
| **Modular Monolith + Clean Layers** | **Medium** | **High** | **Medium** |
| Microservices | High | Medium | High |
| Vertical Slice | Medium | Medium | Medium |

### Decision

Adopt a **Modular Monolith with Clean Architecture internal layering**.

Each module follows Clean Architecture dependency rules (controller → service → repository), but the entire system deploys as a single unit. Module boundaries prevent code leakage across features.

### Consequences

- **Positive:** Single Docker container to deploy. Simple CI/CD. Easy local development.
- **Positive:** Modules can be extracted to microservices without rewriting domain logic.
- **Negative:** Requires discipline to maintain module boundaries. Must enforce via code review and linting.
- **Negative:** Cannot scale modules independently until extraction.

### Recommendation

**Strongly recommended.** This is the best balance for a small team building a SaaS product with long-term goals.

---

## ADR-002: REST over GraphQL

**Date:** 2026-07-04
**Status:** Accepted

### Context

The API needs to serve a React SPA and potentially mobile apps in the future.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| REST | Simple, cacheable, widely understood, easy tooling | Over-fetching, multiple round trips |
| GraphQL | Flexible queries, single endpoint, strong typing | Complex caching, rate limiting harder, learning curve |

### Decision

Use **REST** for the initial API. GraphQL can be added as a side-by-side layer later if needed.

### Consequences

- Standard REST conventions apply (see [api-conventions.md](../.ai/api-conventions.md)).
- Frontend uses TanStack Query for caching and deduplication.
- Migration to GraphQL (if needed) is straightforward by wrapping existing services.

### Recommendation

**REST for now.** Add GraphQL only if mobile clients demand flexible data fetching.

---

## ADR-003: Single Database Instance Initially

**Date:** 2026-07-04
**Status:** Accepted

### Context

Database architecture must support the initial product launch with room to grow.

### Options Considered

| Option | Complexity | Cost | Scalability |
|--------|------------|------|-------------|
| Single MySQL instance | Low | Low | Medium |
| Primary + Read Replicas | Medium | Medium | High |
| Sharded database | High | High | Very High |

### Decision

Start with a **single MySQL instance** with vertical scaling. Add read replicas when read queries become a bottleneck.

### Consequences

- Simple deployment and backup strategy.
- Connection pooling via Prisma.
- Future: Prisma read replica extension for read/write splitting.

### Recommendation

**Single instance** for initial launch. Plan for replicas in Phase 6.

---

## ADR-004: UUID v7 as Primary Keys

**Date:** 2026-07-04
**Status:** Accepted

### Context

Primary key strategy must prevent enumeration, support distributed systems, and provide reasonable sortability.

### Options Considered

| Option | Sortable | Secure | Size |
|--------|----------|--------|------|
| Auto-increment | Yes | No (enumeration) | 4 bytes |
| UUID v4 | No | Yes | 36 chars |
| **UUID v7** | **Yes** | **Yes** | **36 chars** |
| ULID | Yes | Yes | 26 chars |

### Decision

Use **UUID v7** for primary keys. UUID v7 is time-ordered (sortable), random (non-enumerable), and widely supported.

If the library ecosystem does not yet support UUID v7 at implementation time, fall back to UUID v4 with a `created_at` index for sorting.

### Consequences

- Slightly larger than auto-increment integers.
- B-tree indexes benefit from time-ordered UUID v7.
- No enumeration risk (vs auto-increment).

### Recommendation

**UUID v7** — best trade-off between security, sortability, and compatibility.

---

## ADR-005: Manual Dependency Injection over DI Framework

**Date:** 2026-07-04
**Status:** Accepted

### Context

Dependencies must be injectable for testability, but a full DI framework (tsyringe, NestJS) adds significant complexity.

### Options Considered

| Option | Effort | Boilerplate | Flexibility |
|--------|--------|-------------|-------------|
| Manual DI (constructor) | Low | Medium | High |
| tsyringe | Medium | Low | Medium |
| NestJS | High | Low | Low (framework-bound) |

### Decision

Use **manual constructor injection** with a simple composition root in `routes/index.ts`.

```typescript
// Composition root pattern
const repo = new ReservationRepository(prisma);
const service = new ReservationService(repo);
const controller = new ReservationController(service);
router.use('/reservations', controller.router);
```

### Consequences

- More boilerplate than a DI framework.
- No magic — dependencies are explicit and traceable.
- Easy to switch to a DI framework later if the composition root becomes unwieldy.

### Recommendation

**Manual DI** for Phase 3-5. Revisit if the composition root exceeds 50 lines.

---

## ADR-006: Feature-Based Frontend Organization

**Date:** 2026-07-04
**Status:** Accepted

### Context

The frontend must scale to 10+ features without becoming a maintenance burden.

### Options Considered

| Option | Isolation | Code Duplication | Developer Onboarding |
|--------|-----------|------------------|---------------------|
| Feature-based | High | Low | Medium |
| Type-based (components/, pages/, hooks/) | Low | Medium | Low |
| Mixed | Medium | Medium | Medium |

### Decision

Use **feature-based organization** inside `src/features/`. Each feature is a self-contained module with its own components, hooks, pages, and schemas.

### Consequences

- Clear ownership: every file belongs to exactly one feature.
- Easy to locate code related to a feature.
- Shared code extracted to `components/ui/`, `hooks/`, `services/`.

### Recommendation

**Feature-based** — recommended for medium-to-large React applications.

---

## ADR-007: TanStack Query for Server State

**Date:** 2026-07-04
**Status:** Accepted

### Context

The frontend needs a robust strategy for server state management — caching, refetching, optimistic updates, and loading states.

### Options Considered

| Option | Caching | Optimistic Updates | Bundle Size |
|--------|---------|-------------------|-------------|
| TanStack Query | Excellent | Built-in | ~15 KB |
| Redux Toolkit Query | Excellent | Built-in | ~35 KB (with Redux) |
| SWR | Good | Manual | ~8 KB |
| Manual (useEffect) | None | Manual | 0 KB |

### Decision

Use **TanStack Query** for all server state. Client state uses Zustand. Form state uses React Hook Form.

### Consequences

- No duplicate server state in global stores.
- Automatic background refetching.
- Built-in pagination, infinite scroll, and optimistic updates.

### Recommendation

**TanStack Query** — best-in-class for React server state management.

---

## ADR-008: Async Email Notifications (Deferred)

**Date:** 2026-07-04
**Status:** Accepted

### Context

Email notifications (confirmation, reminder, cancellation) can block the API response if sent synchronously.

### Options Considered

| Option | Complexity | User Experience | Reliability |
|--------|------------|-----------------|-------------|
| Synchronous (current) | Low | Slower response | Lower (email failure = request failure) |
| **Async with queue** | **Medium** | **Fast response** | **Higher (retry on failure)** |

### Decision

Start with **synchronous email sending**. Introduce an async queue (Bull + Redis) when email volume exceeds 100 emails/hour or response time becomes an issue.

### Consequences

- Simpler initial implementation.
- Deferred: add Bull queue + Redis container.
- Email failures are logged and can be retried manually until queue is added.

### Recommendation

**Synchronous for now, async when needed.** Track email sending duration in logs to decide when to switch.

---

## ADR Log

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | Modular Monolith + Clean Architecture | Accepted | 2026-07-04 |
| ADR-002 | REST over GraphQL | Accepted | 2026-07-04 |
| ADR-003 | Single Database Instance Initially | Accepted | 2026-07-04 |
| ADR-004 | UUID v7 as Primary Keys | Accepted | 2026-07-04 |
| ADR-005 | Manual DI over DI Framework | Accepted | 2026-07-04 |
| ADR-006 | Feature-Based Frontend Organization | Accepted | 2026-07-04 |
| ADR-007 | TanStack Query for Server State | Accepted | 2026-07-04 |
| ADR-008 | Async Email Notifications (Deferred) | Accepted | 2026-07-04 |

---

## Related Documents

- [architecture-style.md](./architecture-style.md) — Architecture comparison
- [frontend-architecture.md](./frontend-architecture.md) — Frontend decisions
- [backend-architecture.md](./backend-architecture.md) — Backend decisions
- [scalability.md](./scalability.md) — Scaling decisions
