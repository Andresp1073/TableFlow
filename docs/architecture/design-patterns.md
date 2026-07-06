# Design Patterns

**Last updated:** 2026-07-04

## Pattern Recommendation Summary

| Pattern | Adopt? | Where |
|---------|--------|-------|
| Repository | ✅ Yes | Data access layer |
| Service Layer | ✅ Yes | Business logic layer |
| Dependency Injection | ✅ Yes | All layers |
| Factory | ✅ Yes | Complex object creation, tests |
| Builder | ⚠️ Conditional | Query building, test data |
| Strategy | ⚠️ Conditional | Table assignment algorithm |
| Observer | ❌ Not yet | Future: event-driven notifications |
| Singleton | ⚠️ Limited | Prisma client, logger |
| Adapter | ✅ Yes | External integrations |
| Facade | ⚠️ Conditional | Complex module interfaces |

---

## 1. Repository Pattern

**Decision: Adopt**

| Aspect | Detail |
|--------|--------|
| **When to use** | All data access operations in the application. Every module has a repository. |
| **When NOT to use** | Simple reads that don't need abstraction (avoid over-abstraction for trivial queries). |
| **Implementation** | Each module defines an `I{Feature}Repository` interface and a concrete `{Feature}Repository` implementation using Prisma. |
| **Benefit** | Decouples business logic from the ORM. Enables easy testing with in-memory repositories. |

```typescript
interface IReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  findManyByDate(branchId: string, date: Date): Promise<Reservation[]>;
  create(data: CreateReservationData): Promise<Reservation>;
  update(id: string, data: UpdateReservationData): Promise<Reservation>;
  cancel(id: string, reason: string): Promise<Reservation>;
}
```

---

## 2. Service Layer Pattern

**Decision: Adopt**

| Aspect | Detail |
|--------|--------|
| **When to use** | All business logic. Controllers call services; services orchestrate repositories and domain rules. |
| **When NOT to use** | Never. Every piece of business logic belongs in a service. |
| **Implementation** | Services are classes with stateless methods. They depend on repository interfaces (injected). |

```typescript
class ReservationService {
  constructor(private repository: IReservationRepository) {}

  async cancelReservation(id: string, userId: string, reason: string): Promise<Reservation> {
    const reservation = await this.repository.findById(id);
    if (!reservation) throw new NotFoundError('Reservation not found');
    if (reservation.status === 'COMPLETED') {
      throw new BusinessRuleError('Cannot cancel a completed reservation');
    }
    return this.repository.cancel(id, reason);
  }
}
```

---

## 3. Dependency Injection Pattern

**Decision: Adopt**

| Aspect | Detail |
|--------|--------|
| **When to use** | Every class that depends on external resources (repositories, services, config). |
| **When NOT to use** | Pure utility functions (no DI needed). |
| **Implementation** | Constructor injection. Dependencies are passed explicitly. A simple DI container or manual wiring in `routes/index.ts`. |

```typescript
// Manual DI (simple, no framework required)
const reservationRepo = new ReservationRepository(prisma);
const reservationService = new ReservationService(reservationRepo);
const reservationController = new ReservationController(reservationService);
```

---

## 4. Factory Pattern

**Decision: Adopt**

| Aspect | Detail |
|--------|--------|
| **When to use** | Creating complex objects (DTOs, test data, complex entities). |
| **When NOT to use** | Simple objects that can be created with `new` or object literals. |
| **Implementation** | Static factory methods or factory classes. |

```typescript
// Test data factory
export class ReservationFactory {
  static create(overrides: Partial<Reservation> = {}): Reservation {
    return {
      id: uuid(),
      customerId: uuid(),
      branchId: uuid(),
      date: '2025-01-15',
      time: '19:00',
      partySize: 4,
      status: 'PENDING',
      createdAt: new Date(),
      ...overrides,
    };
  }
}
```

---

## 5. Builder Pattern

**Decision: Conditional**

| Aspect | Detail |
|--------|--------|
| **When to use** | Complex query building with many optional parameters. Test data with many variations. |
| **When NOT to use** | Simple object creation (use Factory instead). |
| **Recommended for** | Building Prisma queries with dynamic filters. |

---

## 6. Strategy Pattern

**Decision: Conditional**

| Aspect | Detail |
|--------|--------|
| **When to use** | Table assignment algorithm — multiple strategies (first available, best fit for party size, VIP preference). |
| **When NOT to use** | Single-algorithm scenarios. |
| **Implementation** | `ITableAssignmentStrategy` interface with concrete implementations. Strategy selected based on restaurant configuration. |

---

## 7. Observer / Event Pattern

**Decision: Deferred (Phase 6+)**

| Aspect | Detail |
|--------|--------|
| **When to use** | When modules need to react to events without tight coupling (e.g., reservation created → send notification, update dashboard, log audit). |
| **When NOT to use** | Direct service calls work fine for current module count. Events add complexity. |
| **Future use** | When Notifications, Audit, and Dashboard all need to react to reservation events. At that point, introduce an in-process event bus. |

---

## 8. Singleton Pattern

**Decision: Limited use**

| Aspect | Detail |
|--------|--------|
| **When to use** | Prisma client (single connection pool), Logger instance. |
| **When NOT to use** | Business services — singletons hide dependencies and complicate testing. |
| **Implementation** | Module-level singleton for Prisma (already the recommended pattern). |

---

## 9. Adapter Pattern

**Decision: Adopt**

| Aspect | Detail |
|--------|--------|
| **When to use** | Any external integration: email service (Nodemailer), file storage, SMS provider. |
| **When NOT to use** | Internal module communication. |
| **Implementation** | Define an `IEmailService` interface; implement `SmtpEmailService` and `InMemoryEmailService` (for testing). |

```typescript
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class SmtpEmailService implements IEmailService { ... }
class InMemoryEmailService implements IEmailService { ... } // for tests
```

---

## 10. Facade Pattern

**Decision: Conditional**

| Aspect | Detail |
|--------|--------|
| **When to use** | When a module has complex internal orchestration. The module's public `index.ts` serves as a facade. |
| **When NOT to use** | Simple modules with few internal classes. |
| **Implementation** | Each module's `index.ts` exports a simplified public API (routes, service interface). |

---

## Frontend Patterns

| Pattern | Status | Description |
|---------|--------|-------------|
| **Custom Hooks** | ✅ Adopt | Encapsulate state and side effects |
| **Compound Components** | ✅ Adopt | Flexible UI composition |
| **Render Props** | ❌ Avoid | Use hooks instead |
| **Higher-Order Components** | ❌ Avoid | Use hooks instead |
| **Container/Presentational** | ⚠️ Conditional | Use for complex data-fetching components |
| **Custom Hooks for API** | ✅ Adopt | TanStack Query hooks per feature |

---

## Related Documents

- [architecture-principles.md](../.ai/architecture-principles.md) — Architectural principles
- [module-architecture.md](./module-architecture.md) — How patterns apply per module
- [dependency-rules.md](./dependency-rules.md) — Dependency rules between layers
